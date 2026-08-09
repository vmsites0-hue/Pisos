import { describe, expect, it } from "vitest";
import { evaluateCommercialException } from "./commercial-exception";

describe("commercial exceptions", () => {
  it("allows a permitted discount within the configured limit", () => expect(evaluateCommercialException({ subtotal: 1000, manualDiscount: 50, discountLimitPercent: 5, hasDiscountPermission: true, hasManualPriceChange: false, hasPricePermission: false }).approvalType).toBeNull());
  it("requires approval above the configured limit", () => expect(evaluateCommercialException({ subtotal: 1000, manualDiscount: 51, discountLimitPercent: 5, hasDiscountPermission: true, hasManualPriceChange: false, hasPricePermission: false }).approvalType).toBe("DESCUENTO_SUPERIOR_LIMITE"));
  it("requires approval for a manual price without permission", () => expect(evaluateCommercialException({ subtotal: 1000, manualDiscount: 0, discountLimitPercent: 5, hasDiscountPermission: true, hasManualPriceChange: true, hasPricePermission: false }).approvalType).toBe("CAMBIO_MANUAL_PRECIO"));
});
