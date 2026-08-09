import { describe, expect, it } from "vitest";
import { calculateCashClosure, reopenCashClosure } from "./cash-closure";

describe("cash closure", () => {
  it("records the declared difference", () => expect(calculateCashClosure(100, 95).difference).toBe(-5));
  it("only reopens a confirmed immutable closure", () => {
    expect(reopenCashClosure("CERRADO")).toBe("REABIERTO");
    expect(() => reopenCashClosure("REABIERTO")).toThrow("ya fue reabierto");
  });
});
