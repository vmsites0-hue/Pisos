export type PresentationPrice = {
  mode: "DERIVADO" | "ESPECIFICO";
  factor: number;
  baseUnitPrice: number;
  netPrice?: number | null;
  taxRate?: number;
  finalPrice?: number | null;
  currency?: string;
};

export function resolvePresentationPrice(input: PresentationPrice) {
  if (input.factor <= 0 || input.baseUnitPrice < 0) throw new Error("El factor y el precio deben ser válidos.");
  const currency = input.currency || "PYG";
  const decimals = currency === "PYG" ? 0 : 2;
  const round = (value: number) => Number(value.toFixed(decimals));
  if (input.mode === "DERIVADO") {
    const net = round(input.baseUnitPrice * input.factor);
    return { mode: input.mode, net, tax: 0, final: net, currency, unitPrice: input.baseUnitPrice };
  }
  const rate = input.taxRate ?? 0;
  const net = input.netPrice ?? (input.finalPrice != null ? input.finalPrice / (1 + rate / 100) : NaN);
  const final = round(input.finalPrice ?? net * (1 + rate / 100));
  if (!Number.isFinite(net) || !Number.isFinite(final) || net < 0 || final < 0 || rate < 0) throw new Error("El precio específico es inválido.");
  return { mode: input.mode, net: round(net), tax: round(final - net), final, currency, unitPrice: round(final / input.factor) };
}
