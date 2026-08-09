import type { Prisma } from "@prisma/client";
import { packagingEvents, physicalPackaging } from "@/modules/inventory/domain/open-presentation";

export async function syncPhysicalPackaging(tx: Prisma.TransactionClient, input: { inventoryId: number; previousStock: number; userId: number; reason: string; referenceType?: string; referenceId?: string }) {
  const inventory = await tx.inventario.findUnique({ where: { id: input.inventoryId }, include: { variante: { include: { unidadBase: true, presentaciones: { where: { activa: true }, include: { unidad: true } } } } } });
  if (!inventory?.variante) return;
  const presentation = inventory.variante.presentaciones.find((item) => !item.predeterminada);
  if (!presentation) return;
  const fractionable = ["CAJAS_Y_FRACCION", "CANTIDAD_EXACTA"].includes(inventory.variante.politicaVenta);
  const next = physicalPackaging({ stock: inventory.stockActual, factor: presentation.factorConversion, fractionable, precision: inventory.variante.unidadBase?.precision ?? 2 });
  const events = fractionable ? packagingEvents({ stock: input.previousStock, closed: inventory.presentacionesCerradas, remainder: inventory.remanenteAbierto }, { stock: inventory.stockActual, closed: next.closedPresentations, remainder: next.openRemainder }) : [];
  await tx.inventario.update({ where: { id: inventory.id }, data: { presentacionesCerradas: next.closedPresentations, remanenteAbierto: next.openRemainder } });
  for (const event of events) await tx.eventoPresentacionInventario.create({ data: { inventarioId: inventory.id, usuarioId: input.userId, tipo: event.type, cantidad: event.quantity, remanenteAntes: inventory.remanenteAbierto, remanenteDespues: next.openRemainder, motivo: input.reason, referenciaTipo: input.referenceType, referenciaId: input.referenceId } });
}
