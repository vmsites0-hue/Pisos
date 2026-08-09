import { describe, expect, it } from "vitest";
import { applyInstallmentPayment, installmentDisplayState } from "./installment-payment";

describe("monthly installment collection", () => {
  it("supports partial and full payments", () => { expect(applyInstallmentPayment({ amountDue: 100, alreadyPaid: 0, payment: 40, dueDate: new Date("2030-01-01") }).state).toBe("PAGO_PARCIAL"); expect(applyInstallmentPayment({ amountDue: 100, alreadyPaid: 40, payment: 60, dueDate: new Date("2030-01-01") }).state).toBe("PAGADA"); });
  it("marks an unpaid overdue installment", () => expect(installmentDisplayState({ amountDue: 100, paid: 0, dueDate: new Date("2020-01-01"), now: new Date("2020-02-01") })).toBe("VENCIDA"));
  it("prevents overpayment", () => expect(() => applyInstallmentPayment({ amountDue: 100, alreadyPaid: 90, payment: 11, dueDate: new Date() })).toThrow("supera"));
});
