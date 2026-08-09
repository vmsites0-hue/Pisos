export function evaluateCommercialException(input: { subtotal: number; manualDiscount: number; discountLimitPercent: number; hasDiscountPermission: boolean; hasManualPriceChange: boolean; hasPricePermission: boolean }) {
  const discountPercent = input.subtotal > 0 ? input.manualDiscount * 100 / input.subtotal : 0;
  if (input.hasManualPriceChange && !input.hasPricePermission) return { approvalType: "CAMBIO_MANUAL_PRECIO" as const, discountPercent };
  if (input.manualDiscount > 0 && (!input.hasDiscountPermission || discountPercent > input.discountLimitPercent)) return { approvalType: "DESCUENTO_SUPERIOR_LIMITE" as const, discountPercent };
  return { approvalType: null, discountPercent };
}
