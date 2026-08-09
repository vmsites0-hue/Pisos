export const RECALCULATION_POLICIES = ["CONSERVAR", "MANUAL", "AL_CONVERTIR"] as const;
export type RecalculationPolicy = (typeof RECALCULATION_POLICIES)[number];

export function normalizeRecalculationPolicy(value: string): RecalculationPolicy {
  return RECALCULATION_POLICIES.includes(value as RecalculationPolicy) ? value as RecalculationPolicy : "CONSERVAR";
}

export function quotationValuesChanged(previous: { subtotal: number; total: number; lines: Array<{ variantId: number | null; quantity: number; presentationQuantity: number | null; price: number; subtotal: number }> }, current: typeof previous) {
  const close = (a: number, b: number) => Math.abs(a - b) <= 0.000001;
  if (!close(previous.subtotal, current.subtotal) || !close(previous.total, current.total) || previous.lines.length !== current.lines.length) return true;
  return previous.lines.some((line, index) => { const next = current.lines[index]; return !next || line.variantId !== next.variantId || !close(line.quantity, next.quantity) || !close(line.presentationQuantity ?? 0, next.presentationQuantity ?? 0) || !close(line.price, next.price) || !close(line.subtotal, next.subtotal); });
}
