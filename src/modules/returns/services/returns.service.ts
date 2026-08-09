import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requestApproval } from "@/modules/approvals/services/approvals.service";
import { APPROVAL_TYPES } from "@/modules/approvals/domain/approval-types";
import { inspectReturn } from "@/modules/returns/domain/return-inspection";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { syncMinimumStockAlert } from "@/modules/inventory/services/minimum-stock.service";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function registerReturn(input: { saleId: number; saleDetailId: number; quantity: number; condition: string; reason: string; evidenceUrl?: string | null; approvalId?: number | null }) {
  const actor = await requirePermission(PERMISSIONS.SALES_CREATE);
  if (!input.reason.trim()) return { error: "El motivo de devolución es obligatorio." };
  const sale = await prisma.venta.findUnique({ where: { id: input.saleId }, include: { detalles: { where: { id: input.saleDetailId }, include: { inventario: true, devoluciones: true } } } });
  if (!sale || sale.estado === "CANCELADA" || sale.detalles.length !== 1) return { error: "La venta o línea no está disponible para devolución." };
  const detail = sale.detalles[0];
  if (!detail.inventario) return { error: "La línea no conserva el inventario de origen." };
  const quarantineParameter = await prisma.parametroSistema.findUnique({ where: { clave: "DEVOLUCION_CUARENTENA_HABILITADA" } });
  const quarantineEnabled = quarantineParameter?.valor !== "false";
  const previouslyReturned = detail.devoluciones.reduce((sum, item) => sum + item.cantidad, 0);
  try { inspectReturn({ sold: detail.cantidad, previouslyReturned, requested: input.quantity, condition: input.condition, quarantineEnabled }); }
  catch (error) { return { error: error instanceof Error ? error.message : "La devolución es inválida." }; }

  if (!input.approvalId) {
    const request = await requestApproval({ type: APPROVAL_TYPES.RETURN, reason: input.reason, entity: "Venta", entityId: String(sale.id), previousValues: { detailId: detail.id, returned: previouslyReturned }, proposedValues: { detailId: detail.id, quantity: input.quantity, condition: input.condition, evidenceUrl: input.evidenceUrl } });
    return { error: "La devolución requiere aprobación.", approvalRequestId: request.id };
  }
  const approval = await prisma.solicitudAprobacion.findFirst({ where: { id: input.approvalId, solicitanteId: actor.id, tipo: APPROVAL_TYPES.RETURN, entidad: "Venta", entidadId: String(sale.id), estado: "APROBADA", ejecutadoEn: null } });
  if (!approval) return { error: "La aprobación de devolución no es válida o ya fue utilizada." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.detalleVenta.findUniqueOrThrow({ where: { id: detail.id }, include: { inventario: { include: { variante: { include: { unidadBase: true } } } }, devoluciones: true, venta: { include: { cliente: true } } } });
      if (!current.inventario || current.venta.estado === "CANCELADA") throw new Error("La línea ya no admite devoluciones.");
      const inspected = inspectReturn({ sold: current.cantidad, previouslyReturned: current.devoluciones.reduce((sum, item) => sum + item.cantidad, 0), requested: input.quantity, condition: input.condition, quarantineEnabled });
      const previous = current.inventario.stockActual;
      if (inspected.availableIncrement) {
        await tx.inventario.update({ where: { id: current.inventario.id }, data: { stockActual: { increment: inspected.availableIncrement } } });
        await recordInventoryMovement(tx, { inventoryId: current.inventario.id, variantId: current.varianteId, userId: actor.id, type: "DEVOLUCION", quantity: inspected.availableIncrement, baseUnit: current.inventario.variante?.unidadBase?.codigo ?? "UNIDAD", previousBalance: previous, resultingBalance: previous + inspected.availableIncrement, reason: input.reason, referenceType: "VENTA", referenceId: String(sale.id) });
      } else if (inspected.quarantineIncrement) {
        await tx.inventario.update({ where: { id: current.inventario.id }, data: { stockCuarentena: { increment: inspected.quarantineIncrement } } });
      }
      const refund = input.quantity * current.precioUnitario;
      const header = await tx.devolucion.create({ data: { ventaId: sale.id, usuarioId: actor.id, aprobacionId: approval.id, motivo: input.reason.trim(), evidenciaUrl: input.evidenceUrl?.trim() || null, detalles: { create: { detalleVentaId: current.id, inventarioId: current.inventario.id, cantidad: input.quantity, condicion: input.condition, importe: refund } } }, include: { detalles: true } });
      if (current.venta.metodoPago === "CREDITO") await tx.cliente.update({ where: { id: current.venta.clienteId }, data: { saldoDeudor: Math.max(0, current.venta.cliente.saldoDeudor - refund) } });
      const consumed = await tx.solicitudAprobacion.updateMany({ where: { id: approval.id, estado: "APROBADA", ejecutadoEn: null }, data: { estado: "EJECUTADA", ejecutadoEn: new Date() } });
      if (consumed.count !== 1) throw new Error("La aprobación ya fue utilizada.");
      await syncMinimumStockAlert(tx, current.inventario.id, actor.id);
      await recordAudit({ userId: actor.id, action: inspected.lossQuantity ? "PERDIDA_REGISTRADA" : "DEVOLUCION_REGISTRADA", entity: "Devolucion", entityId: header.id, after: { ventaId: sale.id, cantidad: input.quantity, condicion: input.condition, importe: refund, evidenciaUrl: input.evidenceUrl ?? null } }, tx);
      return header;
    });
    revalidatePath("/ventas"); revalidatePath("/inventario"); revalidatePath("/finanzas");
    return { success: true, return: result };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo registrar la devolución." }; }
}
