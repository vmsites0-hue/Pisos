import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function actualizarEstadoEnvio(
  ventaId: number, 
  nuevoEstado: string,
  chofer?: string | null,
  observaciones?: string | null
) {
  const user = await requirePermission(PERMISSIONS.LOGISTICS_UPDATE);
  try {
    const validStates = ["PENDIENTE", "ENCARGADO", "DESPACHADO", "ENTREGADO"];
    if (!validStates.includes(nuevoEstado)) {
      return { error: "Estado de entrega inválido." };
    }

    const updateData: any = {
      estado: nuevoEstado,
    };

    if (chofer !== undefined) {
      updateData.chofer = chofer;
    }
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones;
    }

    const before = await prisma.venta.findUniqueOrThrow({ where: { id: ventaId } });
    const updated = await prisma.venta.update({
      where: { id: ventaId },
      data: updateData,
    });
    await recordAudit({ userId: user.id, action: "ENTREGA_ACTUALIZADA", entity: "Venta", entityId: ventaId, before, after: updated });

    revalidatePath("/logistica");
    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath("/finanzas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el estado de logística." };
  }
}
