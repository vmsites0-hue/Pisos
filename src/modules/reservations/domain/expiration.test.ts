import { describe, expect, it } from "vitest";
import { isReservationExpired, resolveReservationExpiration } from "./expiration";
const now = new Date("2026-08-09T12:00:00Z");

describe("reservation expiration", () => {
  it("supports no expiration and configured default", () => {
    expect(resolveReservationExpiration({ mode: "NONE", defaultDays: 7, now })).toBeNull();
    expect(resolveReservationExpiration({ mode: "DEFAULT", defaultDays: 7, now })).toEqual(new Date("2026-08-16T12:00:00Z"));
  });
  it("validates custom future dates", () => expect(() => resolveReservationExpiration({ mode: "CUSTOM", customDate: "2026-08-08", defaultDays: 7, now })).toThrow("futura"));
  it("only expires active due reservations", () => { expect(isReservationExpired("ACTIVA", now, now)).toBe(true); expect(isReservationExpired("LIBERADA", now, now)).toBe(false); expect(isReservationExpired("ACTIVA", null, now)).toBe(false); });
});
