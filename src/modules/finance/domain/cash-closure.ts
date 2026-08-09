export function calculateCashClosure(expected: number, declared: number) {
  if (![expected, declared].every(Number.isFinite) || declared < 0) throw new Error("Los importes del cierre son inválidos.");
  return { expected, declared, difference: declared - expected };
}

export function reopenCashClosure(state: string) {
  if (state !== "CERRADO") throw new Error("El cierre no está confirmado o ya fue reabierto.");
  return "REABIERTO" as const;
}
