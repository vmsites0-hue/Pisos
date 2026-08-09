export function resolveReservationExpiration(input: { mode: "NONE" | "DEFAULT" | "CUSTOM"; customDate?: string | null; defaultDays: number; now: Date }) {
  if (input.mode === "NONE") return null;
  if (input.mode === "CUSTOM") {
    const date = new Date(input.customDate ?? "");
    if (Number.isNaN(date.getTime()) || date <= input.now) throw new Error("La fecha de vencimiento debe ser futura.");
    return date;
  }
  if (!Number.isInteger(input.defaultDays) || input.defaultDays <= 0) throw new Error("La duración predeterminada es inválida.");
  const date = new Date(input.now); date.setDate(date.getDate() + input.defaultDays); return date;
}

export function isReservationExpired(state: string, expiresAt: Date | null, now: Date) {
  return state === "ACTIVA" && expiresAt !== null && expiresAt <= now;
}
