import { describe, expect, it } from "vitest";
import { allocateReservation } from "./reservation";

describe("manual stock reservation", () => {
  it("allocates across inventory dimensions without changing physical stock", () => expect(allocateReservation(5, [{ id: 1, physical: 4, reserved: 1 }, { id: 2, physical: 5, reserved: 1 }])).toEqual([{ inventoryId: 1, quantity: 3 }, { inventoryId: 2, quantity: 2 }]));
  it("rejects quantities above available stock", () => expect(() => allocateReservation(4, [{ id: 1, physical: 5, reserved: 2 }])).toThrow("stock disponible"));
});
