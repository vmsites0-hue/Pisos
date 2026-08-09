import type { Prisma } from "@prisma/client";
import { minimumStockTransition } from "@/modules/inventory/domain/minimum-stock";

export async function syncMinimumStockAlert(tx: Prisma.TransactionClient, inventoryId: number, recipientUserId: number) {
  const inventory = await tx.inventario.findUnique({ where: { id: inventoryId }, include: { variante: { include: { producto: true } } } });
  if (!inventory?.variante) return;
  const available = inventory.stockActual - inventory.stockReservado;
  const transition = minimumStockTransition({ available, minimum: inventory.variante.stockMinimo, alertActive: inventory.alertaMinimoActiva, sequence: inventory.alertaMinimoSecuencia });
  if (transition.action === "NONE") return;
  await tx.inventario.update({ where: { id: inventory.id }, data: { alertaMinimoActiva: transition.alertActive, alertaMinimoSecuencia: transition.sequence } });
  if (transition.action === "CREATE") {
    await tx.notificacion.create({ data: {
      usuarioId: recipientUserId, tipo: "STOCK_CRITICO", titulo: "Stock crítico",
      mensaje: `${inventory.variante.sku} - ${inventory.variante.producto.nombre}: disponible ${available}, mínimo ${inventory.variante.stockMinimo}.`,
      enlace: "/inventario", claveIdempotencia: `STOCK_CRITICO:${inventory.id}:${transition.sequence}`,
    } });
  }
}
