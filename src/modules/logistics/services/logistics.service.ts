import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hasPermission, requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { validateDeliveryTransition } from "@/modules/logistics/domain/delivery-state";
import { canConfirmDelivery } from "@/modules/logistics/domain/delivery-confirmation";
import { validateDeliveryFailure } from "@/modules/logistics/domain/delivery-failure";
import { notifyUser } from "@/modules/notifications/services/notification-dispatch.service";
import { notificationKey } from "@/modules/notifications/domain/events";

export async function actualizarEstadoEnvio(
  ventaId: number, 
  nuevoEstado: string,
  chofer?: string | null,
  observaciones?: string | null,
  evidenciaUrl?: string | null,
) {
  const user = await requirePermission(PERMISSIONS.LOGISTICS_UPDATE);
  const canConfirmAny = nuevoEstado === "ENTREGADO" ? await hasPermission(PERMISSIONS.DELIVERY_CONFIRM_ANY) : false;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const delivery = await tx.entrega.findUnique({ where: { ventaId } });
      if (!delivery) throw new Error("La venta no tiene una entrega domiciliaria.");
      validateDeliveryTransition(delivery.estado, nuevoEstado);
      if (nuevoEstado === "ENTREGADO" && !canConfirmDelivery({ actorId: user.id, assignedDriverId: delivery.choferId, canConfirmAny })) throw new Error("Solo el chofer asignado o un supervisor autorizado puede confirmar.");
      const result = await tx.entrega.update({ where: { id: delivery.id }, data: { estado: nuevoEstado, ...(observaciones !== undefined ? { observaciones } : {}), ...(nuevoEstado === "ENTREGADO" ? { confirmadoPorId: user.id, confirmadoEn: new Date(), evidenciaUrl: evidenciaUrl?.trim() || null } : {}) } });
      await tx.eventoEntrega.create({ data: { entregaId: delivery.id, usuarioId: user.id, estadoAnterior: delivery.estado, estadoNuevo: nuevoEstado, observacion: observaciones?.trim() || null } });
      await tx.venta.update({ where: { id: ventaId }, data: { estado: nuevoEstado, ...(chofer !== undefined ? { chofer } : {}), ...(observaciones !== undefined ? { observaciones } : {}) } });
      await recordAudit({ userId: user.id, action: "ENTREGA_TRANSICION", entity: "Entrega", entityId: delivery.id, before: { estado: delivery.estado }, after: { estado: nuevoEstado, observaciones } }, tx);
      return result;
    });
    if (nuevoEstado === "LISTO_DESPACHO") {
      const recipients = [...new Set([updated.encargadoId, updated.choferId].filter((id): id is number => Boolean(id)))];
      for (const recipientId of recipients) await notifyUser({ userId: recipientId, type: "PEDIDO_LISTO", title: "Pedido listo", message: `La venta #${ventaId} está lista para despacho.`, link: "/logistica", idempotencyKey: notificationKey("PEDIDO_LISTO", `${updated.id}:${updated.actualizadaEn.toISOString()}`, recipientId) });
    }

    revalidatePath("/logistica");
    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath("/finanzas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el estado de logística." };
  }
}

export async function assignDelivery(input: { saleId: number; managerId: number; driverId?: number | null }) {
  const actor = await requirePermission(PERMISSIONS.DELIVERY_ASSIGN);
  try {
    const assigned = await prisma.$transaction(async (tx) => {
      const delivery = await tx.entrega.findUnique({ where: { ventaId: input.saleId } });
      if (!delivery || ["ENTREGADO", "CANCELADO"].includes(delivery.estado)) throw new Error("La entrega no admite asignaciones.");
      const users = await tx.usuario.findMany({ where: { id: { in: [input.managerId, ...(input.driverId ? [input.driverId] : [])] }, activo: true } });
      if (!users.some((user) => user.id === input.managerId) || (input.driverId && !users.some((user) => user.id === input.driverId))) throw new Error("El encargado o chofer no es un usuario activo.");
      const updated = await tx.entrega.update({ where: { id: delivery.id }, data: { encargadoId: input.managerId, choferId: input.driverId ?? null } });
      await recordAudit({ userId: actor.id, action: "ENTREGA_ASIGNADA", entity: "Entrega", entityId: delivery.id, before: { encargadoId: delivery.encargadoId, choferId: delivery.choferId }, after: { encargadoId: input.managerId, choferId: input.driverId ?? null } }, tx);
      return updated;
    });
    for (const recipientId of [...new Set([input.managerId, ...(input.driverId ? [input.driverId] : [])])]) await notifyUser({ userId: recipientId, type: "ENTREGA_ASIGNADA", title: "Entrega asignada", message: `Fuiste asignado a la entrega de la venta #${input.saleId}.`, link: "/logistica", idempotencyKey: notificationKey("ENTREGA_ASIGNADA", `${assigned.id}:${assigned.actualizadaEn.toISOString()}`, recipientId) });
    revalidatePath("/logistica"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo asignar la entrega." }; }
}

export async function reportFailedDelivery(input: { saleId: number; reason: string }) {
  const actor = await requirePermission(PERMISSIONS.LOGISTICS_UPDATE);
  const canConfirmAny = await hasPermission(PERMISSIONS.DELIVERY_CONFIRM_ANY);
  try {
    const failed = await prisma.$transaction(async (tx) => {
      const delivery = await tx.entrega.findUnique({ where: { ventaId: input.saleId } });
      if (!delivery) throw new Error("La entrega no existe.");
      validateDeliveryFailure({ state: delivery.estado, reason: input.reason });
      if (!canConfirmDelivery({ actorId: actor.id, assignedDriverId: delivery.choferId, canConfirmAny })) throw new Error("Solo el chofer asignado o un supervisor puede informar la falla.");
      await tx.eventoEntrega.create({ data: { entregaId: delivery.id, usuarioId: actor.id, estadoAnterior: "EN_CAMINO", estadoNuevo: "ENTREGA_FALLIDA", observacion: input.reason.trim() } });
      await tx.eventoEntrega.create({ data: { entregaId: delivery.id, usuarioId: actor.id, estadoAnterior: "ENTREGA_FALLIDA", estadoNuevo: "EN_PREPARACION", observacion: "Reingreso automático al flujo operativo" } });
      await tx.entrega.update({ where: { id: delivery.id }, data: { estado: "EN_PREPARACION", observaciones: input.reason.trim() } });
      await tx.venta.update({ where: { id: input.saleId }, data: { estado: "EN_PREPARACION", observaciones: input.reason.trim() } });
      await recordAudit({ userId: actor.id, action: "ENTREGA_FALLIDA", entity: "Entrega", entityId: delivery.id, after: { motivo: input.reason.trim(), estado: "EN_PREPARACION" } }, tx);
      return { id: delivery.id, managerId: delivery.encargadoId, eventAt: new Date() };
    });
    if (failed.managerId) await notifyUser({ userId: failed.managerId, type: "ENTREGA_FALLIDA", title: "Entrega fallida", message: `La venta #${input.saleId} volvió a preparación: ${input.reason.trim()}`, link: "/logistica", idempotencyKey: notificationKey("ENTREGA_FALLIDA", `${failed.id}:${failed.eventAt.toISOString()}`, failed.managerId) });
    revalidatePath("/logistica"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo informar la entrega fallida." }; }
}
