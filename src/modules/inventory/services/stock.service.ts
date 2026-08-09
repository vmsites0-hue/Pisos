import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { inventoryDimensionsEqual, normalizeInventoryDimension } from "@/modules/inventory/domain/inventory-key";
import { adjustmentDelta, resultingStock } from "@/modules/inventory/domain/stock-movement";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { consumeApproval } from "@/modules/approvals/services/approvals.service";
import { APPROVAL_TYPES } from "@/modules/approvals/domain/approval-types";
import { syncMinimumStockAlert } from "@/modules/inventory/services/minimum-stock.service";
import { syncPhysicalPackaging } from "@/modules/inventory/services/open-presentations.service";

type Adjustment = {
  productoId: number; varianteId: number; sucursalId: number; lote: string | null; tono: string | null; calibre: string | null;
  cantidad: number; tipoAjuste: "SUMAR" | "RESTAR" | "FIJAR"; motivo: string; userId: number;
};

async function applyAdjustment(tx: Prisma.TransactionClient, input: Adjustment) {
  const variant = await tx.varianteProducto.findFirst({ where: { id: input.varianteId, productoId: input.productoId, activa: true }, include: { unidadBase: true } });
  if (!variant) throw new Error("La variante seleccionada no pertenece al producto o está inactiva.");
  const candidates = await tx.inventario.findMany({ where: { varianteId: input.varianteId, sucursalId: input.sucursalId } });
  const existing = candidates.find((item) => inventoryDimensionsEqual(item, input));
  const previous = existing?.stockActual ?? 0;
  const delta = adjustmentDelta(previous, input.cantidad, input.tipoAjuste);
  const balance = resultingStock(previous, delta);
  if (!existing && delta < 0) throw new Error("No se puede restar stock de un inventario inexistente.");
  const loteTono = [input.lote, input.tono, input.calibre].filter(Boolean).join(" / ") || null;
  const inventory = existing
    ? await tx.inventario.update({ where: { id: existing.id }, data: { stockActual: balance, lote: input.lote, tono: input.tono, calibre: input.calibre, loteTono } })
    : await tx.inventario.create({ data: { productoId: input.productoId, varianteId: input.varianteId, sucursalId: input.sucursalId, lote: input.lote, tono: input.tono, calibre: input.calibre, loteTono, stockActual: balance } });
  await recordInventoryMovement(tx, { inventoryId: inventory.id, variantId: input.varianteId, userId: input.userId, type: delta >= 0 ? "INGRESO" : "AJUSTE", quantity: delta, baseUnit: variant.unidadBase?.codigo ?? "UNIDAD", previousBalance: previous, resultingBalance: balance, reason: input.motivo, referenceType: "AJUSTE_MANUAL", referenceId: inventory.id.toString() });
  await syncPhysicalPackaging(tx, { inventoryId: inventory.id, previousStock: previous, userId: input.userId, reason: input.motivo, referenceType: "AJUSTE_MANUAL", referenceId: inventory.id.toString() });
  await syncMinimumStockAlert(tx, inventory.id, input.userId);
  await recordAudit({ userId: input.userId, action: "INVENTARIO_AJUSTADO", entity: "Inventario", entityId: inventory.id, before: existing, after: { ...inventory, tipoAjuste: input.tipoAjuste, motivo: input.motivo } }, tx);
  return { inventory, delta };
}

export async function ajustarStock(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.INVENTORY_ADJUST);
  const mainBranch = await getMainBranch();
  try {
    const input: Adjustment = {
      productoId: Number(formData.get("productoId")), varianteId: Number(formData.get("varianteId")), sucursalId: mainBranch.id,
      lote: normalizeInventoryDimension(formData.get("lote")), tono: normalizeInventoryDimension(formData.get("tono")), calibre: normalizeInventoryDimension(formData.get("calibre")),
      cantidad: Number(formData.get("cantidad")), tipoAjuste: String(formData.get("tipoAjuste")) as Adjustment["tipoAjuste"], motivo: String(formData.get("motivo") ?? "").trim(), userId: user.id,
    };
    if (!input.productoId || !input.varianteId || !Number.isFinite(input.cantidad) || !input.motivo) return { error: "Producto, variante, cantidad y motivo son obligatorios." };
    const existing = await prisma.inventario.findFirst({ where: { varianteId: input.varianteId, sucursalId: input.sucursalId, lote: input.lote, tono: input.tono, calibre: input.calibre } });
    const delta = adjustmentDelta(existing?.stockActual ?? 0, input.cantidad, input.tipoAjuste);
    const approvalRequired = (await prisma.parametroSistema.findUnique({ where: { clave: "APROBACION_AJUSTE_NEGATIVO" } }))?.valor !== "false";
    const approvalId = Number(formData.get("approvalId"));
    if (delta < 0 && approvalRequired) {
      if (!approvalId) return { error: "Este ajuste negativo requiere una aprobación válida." };
      await consumeApproval(approvalId, APPROVAL_TYPES.NEGATIVE_STOCK_ADJUSTMENT, (tx) => applyAdjustment(tx, input));
    } else {
      await prisma.$transaction((tx) => applyAdjustment(tx, input));
    }
    revalidatePath("/inventario");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Error al ajustar el inventario." };
  }
}
