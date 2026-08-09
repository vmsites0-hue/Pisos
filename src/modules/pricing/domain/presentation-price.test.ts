import { describe, expect, it } from "vitest";
import { resolvePresentationPrice } from "./presentation-price";

describe("presentation prices", () => {
  it("derives the presentation price from its conversion", () => expect(resolvePresentationPrice({ mode: "DERIVADO", factor: 2.08, baseUnitPrice: 100 }).final).toBe(208));
  it("uses a specific final price and preserves tax and currency", () => expect(resolvePresentationPrice({ mode: "ESPECIFICO", factor: 2, baseUnitPrice: 100, netPrice: 180, taxRate: 10, currency: "USD" })).toEqual({ mode: "ESPECIFICO", net: 180, tax: 18, final: 198, currency: "USD", unitPrice: 99 }));
  it("rejects invalid specific prices", () => expect(() => resolvePresentationPrice({ mode: "ESPECIFICO", factor: 2, baseUnitPrice: 100 })).toThrow("inválido"));
});
