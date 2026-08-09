export const APPROVAL_TYPES = {
  EXCESSIVE_DISCOUNT: "DESCUENTO_SUPERIOR_LIMITE",
  MANUAL_PRICE_CHANGE: "CAMBIO_MANUAL_PRECIO",
  NEGATIVE_STOCK_ADJUSTMENT: "AJUSTE_NEGATIVO_INVENTARIO",
  SALE_CANCELLATION: "CANCELACION_VENTA",
  RETURN: "DEVOLUCION",
  EXPENSE_DELETION: "ELIMINACION_GASTO",
  CASH_CLOSURE_REOPENING: "REAPERTURA_CIERRE_CAJA",
} as const;

export type ApprovalType = (typeof APPROVAL_TYPES)[keyof typeof APPROVAL_TYPES];

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  DESCUENTO_SUPERIOR_LIMITE: "Descuento superior al límite",
  CAMBIO_MANUAL_PRECIO: "Cambio manual de precio",
  AJUSTE_NEGATIVO_INVENTARIO: "Ajuste negativo de inventario",
  CANCELACION_VENTA: "Cancelación de venta",
  DEVOLUCION: "Devolución",
  ELIMINACION_GASTO: "Eliminación de gasto",
  REAPERTURA_CIERRE_CAJA: "Reapertura de cierre de caja",
};

export function isApprovalType(value: string): value is ApprovalType {
  return Object.values(APPROVAL_TYPES).includes(value as ApprovalType);
}
