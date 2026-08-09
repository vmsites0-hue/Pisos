export const STOCK_MOVEMENT_TYPES = ["INGRESO", "VENTA", "RESERVA", "LIBERACION", "AJUSTE", "DEVOLUCION", "PERDIDA"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export function resultingStock(current: number, delta: number) {
  if (!Number.isFinite(current) || !Number.isFinite(delta)) throw new Error("Las cantidades del movimiento son inválidas.");
  const result = current + delta;
  if (result < -Number.EPSILON) throw new Error("El stock no puede quedar negativo.");
  return Math.max(0, result);
}

export function adjustmentDelta(current: number, quantity: number, mode: "SUMAR" | "RESTAR" | "FIJAR") {
  if (quantity < 0 || !Number.isFinite(quantity)) throw new Error("La cantidad debe ser positiva.");
  if (mode === "SUMAR") return quantity;
  if (mode === "RESTAR") return -quantity;
  if (mode === "FIJAR") return quantity - current;
  throw new Error("Tipo de ajuste inválido.");
}
