import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { validateDeliveryTransition } from "@/modules/logistics/domain/delivery-state";

export async function actualizarEstadoEnvio(
  ventaId: number, 
  nuevoEstado: string,
  chofer?: string | null,
  observaciones?: string | null
) {
  const user = await requirePermission(PERMISSIONS.LOGISTICS_UPDATE);
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const delivery = await tx.entrega.findUnique({ where: { ventaId } });
      if (!delivery) throw new Error("La venta no tiene una entrega domiciliaria.");
      validateDeliveryTransition(delivery.estado, nuevoEstado);
      const result = await tx.entrega.update({ where: { id: delivery.id }, data: { estado: nuevoEstado, ...(observaciones !== undefined ? { observaciones } : {}) } });
      await tx.eventoEntrega.create({ data: { entregaId: delivery.id, usuarioId: user.id, estadoAnterior: delivery.estado, estadoNuevo: nuevoEstado, observacion: observaciones?.trim() || null } });
      await tx.venta.update({ where: { id: ventaId }, data: { estado: nuevoEstado, ...(chofer !== undefined ? { chofer } : {}), ...(observaciones !== undefined ? { observaciones } : {}) } });
      await recordAudit({ userId: user.id, action: "ENTREGA_TRANSICION", entity: "Entrega", entityId: delivery.id, before: { estado: delivery.estado }, after: { estado: nuevoEstado, observaciones } }, tx);
      return result;
    });

    revalidatePath("/logistica");
    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath("/finanzas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el estado de logística." };
  }
}
