import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { inventoryDimensionsEqual, normalizeInventoryDimension } from "@/modules/inventory/domain/inventory-key";

export async function ajustarStock(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.INVENTORY_ADJUST);
  const mainBranch = await getMainBranch();
  try {
    const productoId = parseInt(formData.get("productoId") as string);
    const varianteId = parseInt(formData.get("varianteId") as string);
    const sucursalId = mainBranch.id;
    const lote = normalizeInventoryDimension(formData.get("lote"));
    const tono = normalizeInventoryDimension(formData.get("tono"));
    const calibre = normalizeInventoryDimension(formData.get("calibre"));
    const loteTono = [lote, tono, calibre].filter(Boolean).join(" / ") || null;
    const cantidad = parseFloat(formData.get("cantidad") as string);
    const tipoAjuste = formData.get("tipoAjuste") as string; // "SUMAR", "RESTAR", "FIJAR"

    if (isNaN(productoId) || isNaN(varianteId) || isNaN(cantidad)) {
      return { error: "Faltan datos obligatorios o son inválidos." };
    }

    // Buscar si ya existe un registro de inventario para este producto, sucursal y lote/tono
    const variant = await prisma.varianteProducto.findFirst({ where: { id: varianteId, productoId, activa: true } });
    if (!variant) return { error: "La variante seleccionada no pertenece al producto o está inactiva." };
    const candidates = await prisma.inventario.findMany({
      where: {
        varianteId,
        sucursalId,
      },
    });
    const inventarioExistente = candidates.find((item) => inventoryDimensionsEqual(item, { lote, tono, calibre }));

    let nuevoStock = cantidad;

    if (inventarioExistente) {
      if (tipoAjuste === "SUMAR") {
        nuevoStock = inventarioExistente.stockActual + cantidad;
      } else if (tipoAjuste === "RESTAR") {
        nuevoStock = inventarioExistente.stockActual - cantidad;
      } else if (tipoAjuste === "FIJAR") {
        nuevoStock = cantidad;
      }

      if (nuevoStock < 0) {
        return { error: `El stock resultante (${nuevoStock}) no puede ser menor a 0.` };
      }

      await prisma.inventario.update({
        where: { id: inventarioExistente.id },
        data: { stockActual: nuevoStock, lote, tono, calibre, loteTono },
      });
    } else {
      if (tipoAjuste === "RESTAR") {
        return { error: "No se puede restar stock de un inventario inexistente." };
      }

      if (nuevoStock < 0) {
        return { error: "El stock inicial no puede ser menor a 0." };
      }

      await prisma.inventario.create({
        data: {
          productoId,
          varianteId,
          sucursalId,
          loteTono: loteTono || null,
          lote,
          tono,
          calibre,
          stockActual: nuevoStock,
          stockReservado: 0,
        },
      });
    }

    await recordAudit({
      userId: user.id,
      action: "INVENTARIO_AJUSTADO",
      entity: "Inventario",
      entityId: inventarioExistente?.id,
      before: inventarioExistente,
      after: { productoId, varianteId, sucursalId, lote, tono, calibre, stockActual: nuevoStock, tipoAjuste },
    });

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al ajustar el inventario." };
  }
}
