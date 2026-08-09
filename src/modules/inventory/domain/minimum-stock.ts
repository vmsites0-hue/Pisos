export function minimumStockTransition(input: { available: number; minimum: number; alertActive: boolean; sequence: number }) {
  const critical = input.available <= input.minimum;
  if (critical && !input.alertActive) return { action: "CREATE" as const, alertActive: true, sequence: input.sequence + 1 };
  if (!critical && input.alertActive) return { action: "RESET" as const, alertActive: false, sequence: input.sequence };
  return { action: "NONE" as const, alertActive: input.alertActive, sequence: input.sequence };
}
