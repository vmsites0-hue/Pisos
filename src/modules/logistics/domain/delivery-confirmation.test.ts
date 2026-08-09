import { describe, expect, it } from "vitest";
import { canConfirmDelivery } from "./delivery-confirmation";
describe("delivery confirmation authorization", () => {
  it("allows the assigned driver", () => expect(canConfirmDelivery({ actorId: 4, assignedDriverId: 4, canConfirmAny: false })).toBe(true));
  it("allows an authorized supervisor", () => expect(canConfirmDelivery({ actorId: 1, assignedDriverId: 4, canConfirmAny: true })).toBe(true));
  it("rejects another driver", () => expect(canConfirmDelivery({ actorId: 5, assignedDriverId: 4, canConfirmAny: false })).toBe(false));
});
