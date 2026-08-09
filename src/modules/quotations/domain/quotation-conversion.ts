export type QuotationConversionState = {
  estado: string;
  venceEn: Date | null;
  ventaId?: number | null;
};

export function validateQuotationConversion(quotation: QuotationConversionState, now = new Date()) {
  if (quotation.ventaId) return "El presupuesto ya fue convertido en una venta.";
  if (quotation.estado !== "ABIERTO") return "El presupuesto no está abierto.";
  if (quotation.venceEn && quotation.venceEn <= now) return "El presupuesto está vencido.";
  return null;
}
