import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { allocateReservation } from "@/modules/reservations/domain/reservation";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { syncMinimumStockAlert } from "@/modules/inventory/services/minimum-stock.service";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function createManualReservation(input: { quotationId: number; lines: Array<{ quotationLineId: number; quantity: number }> }) {
  const user = await requirePermission(PERMISSIONS.RESERVATIONS_MANAGE);
  const requested = input.lines.filter((line) => Number.isFinite(line.quantity) && line.quantity > 0);
  if (!input.quotationId || requested.length === 0) throw new Error("Seleccione al menos una cantidad para reservar.");
  const reservation = await prisma.$transaction(async (tx) => {
    const quotation = await tx.presupuesto.findUnique({ where: { id: input.quotationId }, include: { detalles: { include: { variante: { include: { unidadBase: true } }, lineasReserva: { where: { estado: "ACTIVA" } } } } } });
    if (!quotation) throw new Error("El presupuesto no existe.");
    const header = await tx.reservaStock.create({ data: { presupuestoId: quotation.id, creadaPorId: user.id } });
    for (const request of requested) {
      const detail = quotation.detalles.find((line) => line.id === request.quotationLineId);
      if (!detail?.varianteId || !detail.variante) throw new Error("La línea no tiene una variante reservable.");
      const alreadyReserved = detail.lineasReserva.reduce((sum, line) => sum + line.cantidad, 0);
      if (alreadyReserved + request.quantity > detail.cantidad + Number.EPSILON) throw new Error("La reserva supera la cantidad pendiente de la línea.");
      const inventories = await tx.inventario.findMany({ where: { varianteId: detail.varianteId, sucursalId: quotation.sucursalId }, orderBy: [{ lote: "asc" }, { id: "asc" }] });
      const allocations = allocateReservation(request.quantity, inventories.map((item) => ({ id: item.id, physical: item.stockActual, reserved: item.stockReservado })));
      for (const allocation of allocations) {
        const inventory = inventories.find((item) => item.id === allocation.inventoryId)!;
        await tx.inventario.update({ where: { id: inventory.id }, data: { stockReservado: { increment: allocation.quantity } } });
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
