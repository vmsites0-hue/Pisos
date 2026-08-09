import { describe, expect, it } from "vitest";
import { roundMoney, validateCreditPlan } from "./credit-plan";

describe("credit plans", () => {
  it.each(["FRANCES", "ALEMAN"])("supports %s amortization", (system) => expect(() => validateCreditPlan({ system, annualRate: 18, installments: 12, periodicityMonths: 1, firstDueDays: 30, precision: 0 })).not.toThrow());
  it("rejects invalid terms", () => expect(() => validateCreditPlan({ system: "OTRO", annualRate: -1, installments: 0, periodicityMonths: 0, firstDueDays: -1, precision: 9 })).toThrow());
  it("rounds money with explicit precision", () => { expect(roundMoney(10.55, 0)).toBe(11); expect(roundMoney(10.555, 2)).toBe(10.55); });
});
