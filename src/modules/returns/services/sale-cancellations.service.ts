import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requestApproval } from "@/modules/approvals/services/approvals.service";
import { APPROVAL_TYPES } from "@/modules/approvals/domain/approval-types";
import { validateSaleCancellation } from "@/modules/returns/domain/sale-cancellation";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { syncMinimumStockAlert } from "@/modules/inventory/services/minimum-stock.service";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function cancelSale(input: { saleId: number; reason: string; approvalId?: number | null }) {
  const actor = await requirePermission(PERMISSIONS.SALES_CREATE);
  const sale = await prisma.venta.findUnique({ where: { id: input.saleId }, include: { cancelacion: true, detalles: true } });
  if (!sale) return { error: "La venta no existe." };
  try { validateSaleCancellation({ estado: sale.estado, alreadyCancelled: Boolean(sale.cancelacion), reason: input.reason }); }
  catch (error) { return { error: error instanceof Error ? error.message : "No se puede cancelar la venta." }; }

  if (!input.approvalId) {
    const request = await requestApproval({ type: APPROVAL_TYPES.SALE_CANCELLATION, reason: input.reason, entity: "Venta", entityId: String(sale.id), previousValues: { estado: sale.estado, total: sale.total }, proposedValues: { estado: "CANCELADA", motivo: input.reason } });
    return { error: "La cancelación requiere aprobación.", approvalRequestId: request.id };
  }
  const approval = await prisma.solicitudAprobacion.findFirst({ where: { id: input.approvalId, solicitanteId: actor.id, tipo: APPROVAL_TYPES.SALE_CANCELLATION, entidad: "Venta", entidadId: String(sale.id), estado: "APROBADA", ejecutadoEn: null } });
  if (!approval) return { error: "La aprobación no es válida o ya fue utilizada." };

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.venta.findUniqueOrThrow({ where: { id: sale.id }, include: { cancelacion: true, entrega: true, cliente: true, detalles: { include: { inventario: { include: { variante: { include: { unidadBase: true } } } } } } } });
      validateSaleCancellation({ estado: current.estado, alreadyCancelled: Boolean(current.cancelacion), reason: input.reason });
      for (const detail of current.detalles) {
        if (!detail.inventario) throw new Error("La venta no conserva el inventario de origen y no puede revertirse automáticamente.");
        const previous = detail.inventario.stockActual;
        await tx.inventario.update({ where: { id: detail.inventario.id }, data: { stockActual: { increment: detail.cantidad } } });
        await recordInventoryMovement(tx, { inventoryId: detail.inventario.id, variantId: detail.varianteId, userId: actor.id, type: "CANCELACION_VENTA", quantity: detail.cantidad, baseUnit: detail.inventario.variante?.unidadBase?.codigo ?? "UNIDAD", previousBalance: previous, resultingBalance: previous + detail.cantidad, reason: input.reason, referenceType: "VENTA", referenceId: String(current.id) });
        await syncMinimumStockAlert(tx, detail.inventario.id, actor.id);
      }
      if (current.metodoPago === "CREDITO") await tx.cliente.update({ where: { id: current.clienteId }, data: { saldoDeudor: Math.max(0, current.cliente.saldoDeudor - current.total) } });
      await tx.venta.update({ where: { id: current.id }, data: { estado: "CANCELADA", ...(current.entrega ? { entrega: { update: { estado: "CANCELADA" } } } : {}) } });
      await tx.cancelacionVenta.create({ data: { ventaId: current.id, motivo: input.reason.trim(), usuarioId: actor.id, aprobacionId: approval.id } });
      const consumed = await tx.solicitudAprobacion.updateMany({ where: { id: approval.id, estado: "APROBADA", ejecutadoEn: null }, data: { estado: "EJECUTADA", ejecutadoEn: new Date() } });
      if (consumed.count !== 1) throw new Error("La aprobación ya fue utilizada.");
      await recordAudit({ userId: actor.id, action: "VENTA_CANCELADA", entity: "Venta", entityId: current.id, before: { estado: current.estado }, after: { estado: "CANCELADA", motivo: input.reason, aprobacionId: approval.id } }, tx);
    });
    revalidatePath("/ventas"); revalidatePath("/inventario"); revalidatePath("/finanzas"); revalidatePath("/logistica");
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo cancelar la venta." }; }
}
