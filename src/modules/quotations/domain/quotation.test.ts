import { describe, expect, it } from "vitest";
import { canEditQuotation, resolveQuotationExpiration, validateQuotationTotals } from "./quotation";
describe("quotation contract", () => {
  it("only edits open quotations", () => { expect(canEditQuotation("ABIERTO")).toBe(true); expect(canEditQuotation("CONVERTIDO")).toBe(false); expect(canEditQuotation("CANCELADO")).toBe(false); });
  it("defaults to no expiration but supports configured/custom validity", () => { const now = new Date("2026-08-09T00:00:00Z"); expect(resolveQuotationExpiration("NONE", 15, null, now)).toBeNull(); expect(resolveQuotationExpiration("DEFAULT", 15, null, now)).toEqual(new Date("2026-08-24T00:00:00Z")); });
  it("rejects excessive discounts", () => expect(() => validateQuotationTotals(100, 101)).toThrow("superar"));
});
