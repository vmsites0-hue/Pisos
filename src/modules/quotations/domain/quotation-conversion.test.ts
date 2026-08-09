import { describe, expect, it } from "vitest";
import { validateQuotationConversion } from "./quotation-conversion";

const now = new Date("2026-01-10T12:00:00Z");

describe("quotation conversion", () => {
  it("accepts an open quotation without expiration", () => expect(validateQuotationConversion({ estado: "ABIERTO", venceEn: null }, now)).toBeNull());
  it("rejects an expired quotation", () => expect(validateQuotationConversion({ estado: "ABIERTO", venceEn: new Date("2026-01-09") }, now)).toContain("vencido"));
  it("rejects a quotation already converted", () => expect(validateQuotationConversion({ estado: "CONVERTIDO", venceEn: null, ventaId: 8 }, now)).toContain("ya fue convertido"));
  it("rejects a cancelled quotation", () => expect(validateQuotationConversion({ estado: "CANCELADO", venceEn: null }, now)).toContain("no está abierto"));
});
