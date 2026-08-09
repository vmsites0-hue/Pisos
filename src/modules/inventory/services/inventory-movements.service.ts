import type { Prisma } from "@prisma/client";
import type { StockMovementType } from "@/modules/inventory/domain/stock-movement";

export async function recordInventoryMovement(tx: Prisma.TransactionClient, input: {
  inventoryId: number; variantId: number | null; userId: number; type: StockMovementType; quantity: number; baseUnit: string; previousBalance: number; resultingBalance: number; reason: string; referenceType?: string; referenceId?: string;
}) {
  if (!input.reason.trim()) throw new Error("El motivo del movimiento es obligatorio.");
  return tx.movimientoInventario.create({ data: {
    inventarioId: input.inventoryId, varianteId: input.variantId, usuarioId: input.userId, tipo: input.type, cantidad: input.quantity,
    unidadBase: input.baseUnit, saldoAnterior: input.previousBalance, saldoResultante: input.resultingBalance, motivo: input.reason.trim(), referenciaTipo: input.referenceType, referenciaId: input.referenceId,
  } });
}
