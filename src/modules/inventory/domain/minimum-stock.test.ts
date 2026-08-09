import { describe, expect, it } from "vitest";
import { minimumStockTransition } from "./minimum-stock";

describe("minimum stock alert cycle", () => {
  it("creates once while critical", () => {
    expect(minimumStockTransition({ available: 2, minimum: 3, alertActive: false, sequence: 0 })).toEqual({ action: "CREATE", alertActive: true, sequence: 1 });
    expect(minimumStockTransition({ available: 1, minimum: 3, alertActive: true, sequence: 1 }).action).toBe("NONE");
  });
  it("resets after recovery and allows a new cycle", () => {
    expect(minimumStockTransition({ available: 4, minimum: 3, alertActive: true, sequence: 1 })).toEqual({ action: "RESET", alertActive: false, sequence: 1 });
    expect(minimumStockTransition({ available: 3, minimum: 3, alertActive: false, sequence: 1 }).sequence).toBe(2);
  });
});
