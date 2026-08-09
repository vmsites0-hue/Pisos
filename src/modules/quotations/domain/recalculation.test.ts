import { describe, expect, it } from "vitest";
import { normalizeRecalculationPolicy, quotationValuesChanged } from "./recalculation";
const snapshot = { subtotal: 100, total: 90, lines: [{ variantId: 1, quantity: 2, presentationQuantity: 1, price: 50, subtotal: 100 }] };
describe("quotation recalculation", () => {
  it("conserves values by default", () => expect(normalizeRecalculationPolicy("INVALIDA")).toBe("CONSERVAR"));
  it("does nothing when values did not vary", () => expect(quotationValuesChanged(snapshot, structuredClone(snapshot))).toBe(false));
  it("detects commercial changes", () => expect(quotationValuesChanged(snapshot, { ...snapshot, lines: [{ ...snapshot.lines[0], price: 55 }] })).toBe(true));
});
