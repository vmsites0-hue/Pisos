import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function registrarGasto(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.EXPENSES_CREATE);
  const mainBranch = await getMainBranch();
  try {
    const descripcion = (formData.get("descripcion") as string)?.trim();
    const monto = parseFloat(formData.get("monto") as string);
    const categoria = (formData.get("categoria") as string)?.trim() || null;

    if (!descripcion || isNaN(monto) || monto <= 0) {
      return { error: "Faltan datos obligatorios o el monto es inválido." };
    }

    const expense = await prisma.gasto.create({
      data: {
        sucursalId: mainBranch.id,
        descripcion,
        monto,
        categoria,
      },
    });
    await recordAudit({ userId: user.id, action: "GASTO_REGISTRADO", entity: "Gasto", entityId: expense.id, after: expense });

    revalidatePath("/finanzas");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al registrar el gasto." };
  }
}

export async function eliminarGasto(id: number) {
  const user = await requirePermission(PERMISSIONS.EXPENSES_DELETE);
  try {
    const expense = await prisma.gasto.delete({
      where: { id },
    });
    await recordAudit({ userId: user.id, action: "GASTO_ELIMINADO", entity: "Gasto", entityId: id, before: expense });

    revalidatePath("/finanzas");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el gasto." };
  }
}
