export function physicalPackaging(input: { stock: number; factor: number; fractionable: boolean; precision: number }) {
  if (!Number.isFinite(input.stock) || input.stock < 0 || !Number.isFinite(input.factor) || input.factor <= 0) throw new Error("Stock o factor de presentación inválido.");
  const scale = 10 ** input.precision;
  const ratio = input.stock / input.factor;
  if (!input.fractionable && Math.abs(ratio - Math.round(ratio)) > 1 / scale) throw new Error("El producto no fraccionable solo admite presentaciones completas.");
  const closedPresentations = input.fractionable ? Math.floor(ratio + Number.EPSILON) : Math.round(ratio);
  const openRemainder = input.fractionable ? Math.round((input.stock - closedPresentations * input.factor) * scale) / scale : 0;
  return { closedPresentations, openRemainder };
}

export function packagingEvents(previous: { stock: number; closed: number; remainder: number }, next: { stock: number; closed: number; remainder: number }) {
  const events: Array<{ type: "APERTURA" | "CONSUMO"; quantity: number }> = [];
  if (next.closed < previous.closed && next.remainder > previous.remainder) events.push({ type: "APERTURA", quantity: previous.closed - next.closed });
  if (next.stock < previous.stock) events.push({ type: "CONSUMO", quantity: Math.round((previous.stock - next.stock) * 1_000_000) / 1_000_000 });
  return events;
}
