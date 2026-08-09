import { prisma } from "@/lib/prisma";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { syncMinimumStockAlert } from "@/modules/inventory/services/minimum-stock.service";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { notifyUser } from "@/modules/notifications/services/notification-dispatch.service";
import { notificationKey } from "@/modules/notifications/domain/events";

export async function expireDueReservations(now = new Date()) {
  const warningLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const approaching = await prisma.reservaStock.findMany({ where: { estado: "ACTIVA", venceEn: { gt: now, lte: warningLimit } }, select: { id: true, creadaPorId: true, venceEn: true } });
  for (const reservation of approaching) await notifyUser({ userId: reservation.creadaPorId, type: "RESERVA_PROXIMA_VENCER", title: "Reserva próxima a vencer", message: `La reserva #${reservation.id} vence pronto.`, link: "/presupuestos", idempotencyKey: notificationKey("RESERVA_PROXIMA_VENCER", reservation.id, reservation.creadaPorId) });
  const due = await prisma.reservaStock.findMany({ where: { estado: "ACTIVA", venceEn: { lte: now } }, select: { id: true } });
  let released = 0;
  for (const { id } of due) {
    const didRelease = await prisma.$transaction(async (tx) => {
      const claimed = await tx.reservaStock.updateMany({ where: { id, estado: "ACTIVA", venceEn: { lte: now } }, data: { estado: "VENCIDA", liberadaEn: now, motivoLiberacion: "VENCIMIENTO_AUTOMATICO" } });
      if (claimed.count !== 1) return false;
      const reservation = await tx.reservaStock.findUniqueOrThrow({ where: { id }, include: { lineas: { where: { estado: "ACTIVA" }, include: { inventario: { include: { variante: { include: { unidadBase: true } } } } } } } });
      for (const line of reservation.lineas) {
        if (line.inventario.stockReservado + Number.EPSILON < line.cantidad) throw new Error("La reserva tiene un saldo inconsistente.");
        await tx.inventario.update({ where: { id: line.inventarioId }, data: { stockReservado: { decrement: line.cantidad } } });
        await tx.lineaReservaStock.update({ where: { id: line.id }, data: { estado: "LIBERADA" } });
        await recordInventoryMovement(tx, { inventoryId: line.inventarioId, variantId: line.inventario.varianteId, userId: reservation.creadaPorId, type: "LIBERACION", quantity: line.cantidad, baseUnit: line.inventario.variante?.unidadBase?.codigo ?? "UNIDAD", previousBalance: line.inventario.stockActual, resultingBalance: line.inventario.stockActual, reason: "Liberación automática por vencimiento", referenceType: "RESERVA", referenceId: id.toString() });
        await syncMinimumStockAlert(tx, line.inventarioId, reservation.creadaPorId);
      }
      await tx.notificacion.create({ data: { usuarioId: reservation.creadaPorId, tipo: "RESERVA_LIBERADA", titulo: "Reserva liberada", mensaje: `La reserva ${id} venció y su stock fue liberado.`, enlace: "/presupuestos", claveIdempotencia: `RESERVA_LIBERADA:${id}` } });
      await recordAudit({ userId: reservation.creadaPorId, action: "RESERVA_VENCIDA_LIBERADA", entity: "ReservaStock", entityId: id, after: { estado: "VENCIDA", liberadaEn: now } }, tx);
      return true;
    });
    if (didRelease) released += 1;
  }
  return { examined: due.length, released };
}
