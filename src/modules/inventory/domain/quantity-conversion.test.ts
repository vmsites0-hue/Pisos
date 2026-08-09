import { describe, expect, it } from "vitest";
import { calculateSaleQuantity } from "./quantity-conversion";

describe("sale quantity conversion", () => {
  it("converts 10 m² into 5 complete boxes and 10.40 m²", () => {
    expect(calculateSaleQuantity({ requestedQuantity: 10, conversionFactor: 2.08, policy: "SOLO_CAJAS_COMPLETAS", precision: 2 })).toEqual({ requestedQuantity: 10, actualQuantity: 10.4, presentationQuantity: 5, completePresentations: 5, remainder: 0 });
  });
  it("changes behavior only through policy", () => {
    expect(calculateSaleQuantity({ requestedQuantity: 10, conversionFactor: 2.08, policy: "CANTIDAD_EXACTA", precision: 2 }).actualQuantity).toBe(10);
    expect(calculateSaleQuantity({ requestedQuantity: 10.1, policy: "UNIDADES_ENTERAS", precision: 0 }).actualQuantity).toBe(11);
    expect(calculateSaleQuantity({ requestedQuantity: 10.1, policy: "MULTIPLO_CONFIGURABLE", precision: 2, multiple: 2.5 }).actualQuantity).toBe(12.5);
  });
  it("reports complete presentations and remainder when fractions are allowed", () => {
    expect(calculateSaleQuantity({ requestedQuantity: 5, conversionFactor: 2.08, policy: "CAJAS_Y_FRACCION", precision: 2 })).toMatchObject({ actualQuantity: 5, completePresentations: 2, remainder: 0.84 });
  });
});
