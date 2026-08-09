import { describe, expect, it } from "vitest";
import { buildAmortizationSchedule } from "./amortization";

const base = { principal: 1200, annualRate: 12, installments: 3, periodicityMonths: 1, firstDueDate: new Date("2026-02-01T00:00:00Z"), precision: 2 };
describe("amortization schedule", () => {
  it("builds fixed French payments", () => { const result = buildAmortizationSchedule({ ...base, system: "FRANCES" }); expect(result.installments).toHaveLength(3); expect(result.installments[0].payment).toBe(result.installments[1].payment); expect(result.installments[2].balance).toBe(0); });
  it("builds decreasing German payments", () => { const result = buildAmortizationSchedule({ ...base, system: "ALEMAN" }); expect(result.installments[0].payment).toBeGreaterThan(result.installments[1].payment); expect(result.installments[2].balance).toBe(0); });
  it("includes number, due date, capital, interest, payment and balance", () => expect(buildAmortizationSchedule({ ...base, system: "FRANCES" }).installments[0]).toEqual(expect.objectContaining({ number: 1, dueDate: expect.any(Date), capital: expect.any(Number), interest: expect.any(Number), payment: expect.any(Number), balance: expect.any(Number) })));
});
