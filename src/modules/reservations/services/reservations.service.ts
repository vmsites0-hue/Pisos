import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { allocateReservation } from "@/modules/reservations/domain/reservation";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { syncMinimumStockAlert } from "@/modules/inventory/services/minimum-stock.service";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { resolveReservationExpiration } from "@/modules/reservations/domain/expiration";
import { canReleaseReservation } from "@/modules/reservations/domain/reservation-state";
import { procesarVenta } from "@/modules/sales/services/sales.service";
import { compararVariacionesPresupuesto, recalcularPresupuesto } from "@/modules/quotations/services/quotations.service";

export async function createManualReservation(input: { quotationId: number; lines: Array<{ quotationLineId: number; quantity: number }>; expirationMode: "NONE" | "DEFAULT" | "CUSTOM"; customExpiration?: string | null }) {
  const user = await requirePermission(PERMISSIONS.RESERVATIONS_MANAGE);
  const requested = input.lines.filter((line) => Number.isFinite(line.quantity) && line.quantity > 0);
  if (!input.quotationId || requested.length === 0) throw new Error("Seleccione al menos una cantidad para reservar.");
  const duration = await prisma.parametroSistema.findUnique({ where: { clave: "RESERVA_DURACION_DIAS" } });
  const expiresAt = resolveReservationExpiration({ mode: input.expirationMode, customDate: input.customExpiration, defaultDays: Number(duration?.valor ?? 7), now: new Date() });
  const reservation = await prisma.$transaction(async (tx) => {
    const quotation = await tx.presupuesto.findUnique({ where: { id: input.quotationId }, include: { detalles: { include: { variante: { include: { unidadBase: true } }, lineasReserva: { where: { estado: "ACTIVA" } } } } } });
    if (!quotation) throw new Error("El presupuesto no existe.");
    const header = await tx.reservaStock.create({ data: { presupuestoId: quotation.id, creadaPorId: user.id, venceEn: expiresAt } });
    for (const request of requested) {
      const detail = quotation.detalles.find((line) => line.id === request.quotationLineId);
      if (!detail?.varianteId || !detail.variante) throw new Error("La línea no tiene una variante reservable.");
      const alreadyReserved = detail.lineasReserva.reduce((sum, line) => sum + line.cantidad, 0);
      if (alreadyReserved + request.quantity > detail.cantidad + Number.EPSILON) throw new Error("La reserva supera la cantidad pendiente de la línea.");
      const inventories = await tx.inventario.findMany({ where: { varianteId: detail.varianteId, sucursalId: quotation.sucursalId }, orderBy: [{ lote: "asc" }, { id: "asc" }] });
      const allocations = allocateReservation(request.quantity, inventories.map((item) => ({ id: item.id, physical: item.stockActual, reserved: item.stockReservado })));
      for (const allocation of allocations) {
        const inventory = inventories.find((item) => item.id === allocation.inventoryId)!;
        const claimedStock = await tx.inventario.updateMany({ where: { id: inventory.id, stockActual: inventory.stockActual, stockReservado: inventory.stockReservado }, data: { stockReservado: { increment: allocation.quantity } } });
        if (claimedStock.count !== 1) throw new Error("El stock cambió por otra operación. Actualice y vuelva a intentar.");
        await tx.lineaReservaStock.create({ data: { reservaId: header.id, detallePresupuestoId: detail.id, inventarioId: inventory.id, cantidad: allocation.quantity } });
        await recordInventoryMovement(tx, { inventoryId: inventory.id, variantId: detail.varianteId, userId: user.id, type: "RESERVA", quantity: allocation.quantity, baseUnit: detail.variante.unidadBase?.codigo ?? "UNIDAD", previousBalance: inventory.stockActual, resultingBalance: inventory.stockActual, reason: `Reserva manual del presupuesto ${quotation.id}`, referenceType: "RESERVA", referenceId: header.id.toString() });
        await syncMinimumStockAlert(tx, inventory.id, user.id);
      }
    }
    await recordAudit({ userId: user.id, action: "RESERVA_CREADA", entity: "ReservaStock", entityId: header.id, after: { quotationId: quotation.id, lines: requested } }, tx);
    return header;
  });
  revalidatePath("/presupuestos"); revalidatePath("/inventario");
  return reservation;
}

export async function releaseReservation(id: number, reason: string) {
  const user = await requirePermission(PERMISSIONS.RESERVATIONS_MANAGE);
  if (!reason.trim()) throw new Error("El motivo de liberación es obligatorio.");
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservaStock.findUniqueOrThrow({ where: { id }, include: { lineas: { where: { estado: "ACTIVA" }, include: { inventario: { include: { variante: { include: { unidadBase: true } } } } } } } });
    if (!canReleaseReservation(reservation.estado)) throw new Error("La reserva ya fue liberada, vencida o consumida.");
    const claimed = await tx.reservaStock.updateMany({ where: { id, estado: { in: ["ACTIVA", "PARCIALMENTE_CONSUMIDA"] } }, data: { estado: "LIBERADA", liberadaEn: new Date(), motivoLiberacion: reason.trim() } });
    if (claimed.count !== 1) throw new Error("La reserva fue modificada por otra operación.");
    for (const line of reservation.lineas) {
      await tx.inventario.update({ where: { id: line.inventarioId }, data: { stockReservado: { decrement: line.cantidad } } });
      await tx.lineaReservaStock.update({ where: { id: line.id }, data: { estado: "LIBERADA" } });
      await recordInventoryMovement(tx, { inventoryId: line.inventarioId, variantId: line.inventario.varianteId, userId: user.id, type: "LIBERACION", quantity: line.cantidad, baseUnit: line.inventario.variante?.unidadBase?.codigo ?? "UNIDAD", previousBalance: line.inventario.stockActual, resultingBalance: line.inventario.stockActual, reason: reason.trim(), referenceType: "RESERVA", referenceId: id.toString() });
      await syncMinimumStockAlert(tx, line.inventarioId, user.id);
    }
    await recordAudit({ userId: user.id, action: "RESERVA_LIBERADA", entity: "ReservaStock", entityId: id, after: { estado: "LIBERADA", motivo: reason.trim() } }, tx);
  });
  revalidatePath("/presupuestos"); revalidatePath("/inventario");
}

export async function convertReservationToSale(input: { reservationId: number; paymentMethod: string; deliveryType: string; variationDecision?: "AUTO" | "PRESERVE" | "RECALCULATE" | "CANCEL" }) {
  let reservation = await prisma.reservaStock.findUnique({ where: { id: input.reservationId }, include: { presupuesto: { include: { detalles: true, venta: { select: { id: true } } } }, lineas: { where: { estado: "ACTIVA" }, include: { detallePresupuesto: true, inventario: true } } } });
  if (!reservation || reservation.estado !== "ACTIVA" || (reservation.venceEn && reservation.venceEn <= new Date())) return { error: "La reserva está vencida, liberada o ya fue utilizada." };
  if (reservation.presupuesto.venta) return { error: "El presupuesto ya fue convertido en una venta." };
  if (!reservation.lineas.length) return { error: "La reserva no tiene líneas activas." };
  if (input.variationDecision === "CANCEL") return { error: "Conversión cancelada por el usuario." };
  const comparison = await compararVariacionesPresupuesto(reservation.presupuestoId);
  if (comparison.error) return comparison;
  if (comparison.hasVariations) {
    const decision = input.variationDecision === "AUTO" || !input.variationDecision
      ? (reservation.presupuesto.politicaRecalculo === "AL_CONVERTIR" ? "RECALCULATE" : reservation.presupuesto.politicaRecalculo === "CONSERVAR" ? "PRESERVE" : "REVIEW")
      : input.variationDecision;
    if (decision === "REVIEW") return { error: "El presupuesto tiene variaciones. Debe elegir conservar o recalcular antes de convertir.", variations: comparison };
    if (decision === "RECALCULATE") {
      const recalculation = await recalcularPresupuesto(reservation.presupuestoId);
      if (recalculation.error) return recalculation;
      reservation = await prisma.reservaStock.findUnique({ where: { id: input.reservationId }, include: { presupuesto: { include: { detalles: true, venta: { select: { id: true } } } }, lineas: { where: { estado: "ACTIVA" }, include: { detallePresupuesto: true, inventario: true } } } });
      if (!reservation) return { error: "No se pudo recargar la reserva recalculada." };
    }
  }
  return procesarVenta({ clienteId: reservation.presupuesto.clienteId, descuento: reservation.presupuesto.descuento, metodoPago: input.paymentMethod, tipoEntrega: input.deliveryType, reservaId: reservation.id, presupuestoId: reservation.presupuestoId, sucursalId: reservation.presupuesto.sucursalId, detalles: reservation.lineas.map((line) => ({ productoId: line.detallePresupuesto.productoId, varianteId: line.inventario.varianteId, inventarioId: line.inventarioId, lineaReservaId: line.id, loteTono: line.inventario.loteTono, cantidad: line.cantidad, precioUnitario: line.detallePresupuesto.precioUnitario })) });
}
