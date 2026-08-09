import { describe, expect, it } from "vitest";
import { buildReceiptSummary } from "./receipt";

describe("internal receipt", () => {
  it("summarizes tax, discounts and total as non-fiscal", () => expect(buildReceiptSummary([{ subtotal: 1000, impuesto: 90.91, moneda: "PYG" }], 100)).toEqual({ subtotal: 1000, discount: 100, tax: 90.91, total: 900, currency: "PYG", fiscal: false }));
  it("rejects mixed currencies", () => expect(() => buildReceiptSummary([{ subtotal: 1, impuesto: 0, moneda: "PYG" }, { subtotal: 1, impuesto: 0, moneda: "USD" }], 0)).toThrow("monedas"));
});
