import { describe, expect, it } from "vitest";
import { inspectReturn } from "./return-inspection";

describe("return inspection", () => {
  it("returns fit goods to available stock", () => expect(inspectReturn({ sold: 10, previouslyReturned: 2, requested: 3, condition: "APTO", quarantineEnabled: true }).availableIncrement).toBe(3));
  it("registers defective goods as loss without stock", () => expect(inspectReturn({ sold: 10, previouslyReturned: 0, requested: 3, condition: "DEFECTUOSO", quarantineEnabled: true })).toMatchObject({ availableIncrement: 0, lossQuantity: 3 }));
  it("separates quarantine and enforces its policy", () => { expect(inspectReturn({ sold: 10, previouslyReturned: 0, requested: 2, condition: "CUARENTENA", quarantineEnabled: true }).quarantineIncrement).toBe(2); expect(() => inspectReturn({ sold: 10, previouslyReturned: 0, requested: 2, condition: "CUARENTENA", quarantineEnabled: false })).toThrow("deshabilitada"); });
  it("prevents returning more than sold", () => expect(() => inspectReturn({ sold: 10, previouslyReturned: 8, requested: 3, condition: "APTO", quarantineEnabled: true })).toThrow("supera"));
});
