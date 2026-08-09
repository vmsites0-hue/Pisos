export function canConsumeReservation(state: string, expiresAt: Date | null, now: Date) {
  return state === "ACTIVA" && (expiresAt === null || expiresAt > now);
}
export function canReleaseReservation(state: string) { return state === "ACTIVA" || state === "PARCIALMENTE_CONSUMIDA"; }
