import type { Prisma } from "@prisma/client";
export function recordFinancialMovement(tx: Prisma.TransactionClient, input: { type: "INGRESO" | "EGRESO"; category: string; amount: number; affectsResult: boolean; affectsCash: boolean; paymentMethod?: string | null; userId: number; referenceType: string; referenceId: string | number; description: string }) {
  if (!Number.isFinite(input.amount) || input.amount < 0 || !input.description.trim()) throw new Error("El movimiento financiero es inválido.");
  return tx.movimientoFinanciero.create({ data: { tipo: input.type, categoria: input.category, importe: input.amount, afectaResultado: input.affectsResult, afectaCaja: input.affectsCash, metodoPago: input.paymentMethod, usuarioId: input.userId, referenciaTipo: input.referenceType, referenciaId: String(input.referenceId), descripcion: input.description.trim() } });
}
