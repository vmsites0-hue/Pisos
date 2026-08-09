import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { recordFinancialMovement } from "./financial-movements.service";
import { APPROVAL_TYPES } from "@/modules/approvals/domain/approval-types";
import { consumeApproval, requestApproval } from "@/modules/approvals/services/approvals.service";
import { cancelExpense } from "../domain/expense";

export async function registrarGasto(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.EXPENSES_CREATE);
  const mainBranch = await getMainBranch();
  try {
    const descripcion = (formData.get("descripcion") as string)?.trim();
    const monto = parseFloat(formData.get("monto") as string);
    const categoria = (formData.get("categoria") as string)?.trim() || null;
    const metodoPago = (formData.get("metodoPago") as string)?.trim() || "EFECTIVO";
    const comprobanteUrl = (formData.get("comprobanteUrl") as string)?.trim() || null;

    if (!descripcion || isNaN(monto) || monto <= 0) {
      return { error: "Faltan datos obligatorios o el monto es inválido." };
    }

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.gasto.create({ data: {
        sucursalId: mainBranch.id,
        descripcion,
        monto,
        categoria,
        metodoPago,
        comprobanteUrl,
        usuarioId: user.id,
      } });
      await recordFinancialMovement(tx, { type: "EGRESO", category: "GASTO", amount: monto, affectsResult: true, affectsCash: true, paymentMethod: metodoPago, userId: user.id, referenceType: "Gasto", referenceId: created.id, description: descripcion });
      await recordAudit({ userId: user.id, action: "GASTO_REGISTRADO", entity: "Gasto", entityId: created.id, after: created }, tx);
      return created;
    });

    revalidatePath("/finanzas");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al registrar el gasto." };
  }
}

export async function eliminarGasto(id: number, motivo: string, approvalId?: number) {
  const user = await requirePermission(PERMISSIONS.EXPENSES_DELETE);
  try {
    const expense = await prisma.gasto.findUniqueOrThrow({ where: { id } });
    const cancellation = cancelExpense(expense.estado as "CONFIRMADO" | "ANULADO", motivo);
    if (!approvalId) {
      const approval = await requestApproval({ type: APPROVAL_TYPES.EXPENSE_DELETION, reason: cancellation.reason, entity: "Gasto", entityId: String(id), previousValues: expense, proposedValues: { expenseId: id, reason: cancellation.reason } });
      return { approvalRequired: true, approvalRequestId: approval.id };
    }
    await consumeApproval(approvalId, APPROVAL_TYPES.EXPENSE_DELETION, async (tx, proposed) => {
      const values = proposed as { expenseId: number; reason: string };
      if (values.expenseId !== id) throw new Error("La autorizacion no corresponde al gasto.");
      const current = await tx.gasto.findUniqueOrThrow({ where: { id } });
      cancelExpense(current.estado as "CONFIRMADO" | "ANULADO", values.reason);
      const updated = await tx.gasto.update({ where: { id }, data: { estado: "ANULADO", anuladoEn: new Date(), motivoAnulacion: values.reason } });
      await recordFinancialMovement(tx, { type: "INGRESO", category: "ANULACION_GASTO", amount: current.monto, affectsResult: true, affectsCash: true, paymentMethod: current.metodoPago, userId: user.id, referenceType: "Gasto", referenceId: id, description: `Anulacion: ${current.descripcion}` });
      await recordAudit({ userId: user.id, action: "GASTO_ANULADO", entity: "Gasto", entityId: id, before: current, after: updated }, tx);
    });

    revalidatePath("/finanzas");
    revalidatePath("/");
    return { success: true, approvalRequired: false };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el gasto." };
  }
}
