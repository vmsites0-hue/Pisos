export function canEditQuotation(state: string) { return state === "ABIERTO"; }
export function resolveQuotationExpiration(mode: "NONE" | "DEFAULT" | "CUSTOM", defaultDays: number, customDate: string | null | undefined, now: Date) {
  if (mode === "NONE") return null;
  if (mode === "DEFAULT") { const date = new Date(now); date.setDate(date.getDate() + defaultDays); return date; }
  const date = new Date(customDate ?? "");
  if (Number.isNaN(date.getTime()) || date <= now) throw new Error("La vigencia del presupuesto debe ser futura.");
  return date;
}

export function validateQuotationTotals(subtotal: number, discount: number) {
  if (!Number.isFinite(subtotal) || subtotal < 0 || !Number.isFinite(discount) || discount < 0 || discount > subtotal) throw new Error("El descuento no puede superar el subtotal.");
  return subtotal - discount;
}
