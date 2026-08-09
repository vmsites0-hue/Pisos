import { describe, expect, it } from "vitest";
import { financialProjection } from "./financial-movement";
describe("financial movements", () => {
  it("separates accrued commercial result from cash flow", () => expect(financialProjection([{ type: "INGRESO", amount: 1000, affectsResult: true, affectsCash: false }, { type: "INGRESO", amount: 400, affectsResult: false, affectsCash: true }, { type: "EGRESO", amount: 100, affectsResult: true, affectsCash: true }])).toEqual({ commercialResult: 900, cashFlow: 300 }));
});
