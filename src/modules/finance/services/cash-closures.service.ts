import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { APPROVAL_TYPES } from "@/modules/approvals/domain/approval-types";
import { consumeApproval, requestApproval } from "@/modules/approvals/services/approvals.service";
import { calculateCashClosure, reopenCashClosure } from "../domain/cash-closure";

export async function closeCash(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.PAYMENTS_CREATE);
  try {
    const from = new Date(String(formData.get("from")));
    const to = new Date(String(formData.get("to")));
    const declared = Number(formData.get("declared"));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new Error("El período es inválido.");
    const movements = await prisma.movimientoFinanciero.findMany({ where: { creadoEn: { gte: from, lte: to }, afectaCaja: true } });
    const expected = movements.reduce((sum, item) => sum + (item.tipo === "INGRESO" ? item.importe : -item.importe), 0);
    const values = calculateCashClosure(expected, declared);
    const closure = await prisma.cierreCaja.create({ data: { periodoDesde: from, periodoHasta: to, responsableId: actor.id, importeEsperado: values.expected, importeDeclarado: values.declared, diferencia: values.difference } });
    await recordAudit({ userId: actor.id, action: "CAJA_CERRADA", entity: "CierreCaja", entityId: closure.id, after: closure });
    revalidatePath("/finanzas");
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo cerrar la caja." }; }
}

export async function reopenClosure(id: number, reason: string, approvalId?: number) {
  const actor = await requirePermission(PERMISSIONS.PAYMENTS_CREATE);
  try {
    const closure = await prisma.cierreCaja.findUniqueOrThrow({ where: { id } });
    reopenCashClosure(closure.estado);
    if (!approvalId) {
      const request = await requestApproval({ type: APPROVAL_TYPES.CASH_CLOSURE_REOPENING, reason, entity: "CierreCaja", entityId: String(id), previousValues: closure, proposedValues: { closureId: id, reason } });
      return { approvalRequired: true, approvalRequestId: request.id };
    }
    await consumeApproval(approvalId, APPROVAL_TYPES.CASH_CLOSURE_REOPENING, async (tx, proposed) => {
      const values = proposed as { closureId: number };
      if (values.closureId !== id) throw new Error("La autorización no corresponde al cierre.");
      const current = await tx.cierreCaja.findUniqueOrThrow({ where: { id } });
      const state = reopenCashClosure(current.estado);
      const updated = await tx.cierreCaja.update({ where: { id }, data: { estado: state, reabiertoEn: new Date(), aprobacionReaperturaId: approvalId } });
      await recordAudit({ userId: actor.id, action: "CAJA_REABIERTA", entity: "CierreCaja", entityId: id, before: current, after: updated }, tx);
    });
    revalidatePath("/finanzas");
    return { success: true, approvalRequired: false };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo reabrir el cierre." }; }
}
