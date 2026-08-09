export function buildReceiptSummary(lines: Array<{ subtotal: number; impuesto: number; moneda: string }>, discount: number) {
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const tax = lines.reduce((sum, line) => sum + line.impuesto, 0);
  const currencies = [...new Set(lines.map((line) => line.moneda))];
  if (currencies.length > 1) throw new Error("El comprobante no puede mezclar monedas.");
  return { subtotal, discount, tax, total: Math.max(0, subtotal - discount), currency: currencies[0] ?? "PYG", fiscal: false };
}
