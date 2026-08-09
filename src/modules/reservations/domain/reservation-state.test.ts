import { describe, expect, it } from "vitest";
import { canConsumeReservation, canReleaseReservation } from "./reservation-state";
describe("reservation lifecycle", () => {
  const now = new Date("2026-08-09T12:00:00Z");
  it("rejects expired, released and consumed reservations", () => { expect(canConsumeReservation("ACTIVA", new Date("2026-08-09T11:00:00Z"), now)).toBe(false); expect(canConsumeReservation("LIBERADA", null, now)).toBe(false); expect(canConsumeReservation("CONSUMIDA", null, now)).toBe(false); });
  it("allows active reservations and releases partial ones", () => { expect(canConsumeReservation("ACTIVA", null, now)).toBe(true); expect(canReleaseReservation("PARCIALMENTE_CONSUMIDA")).toBe(true); });
});
