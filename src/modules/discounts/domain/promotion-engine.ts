export type PromotionItem = { productoId: number; varianteId?: number | null; categoriaId: number; familiaId?: number | null; marcaId?: number | null; cantidad: number; subtotal: number };
export type PromotionRule = { id: number; nombre: string; tipo?: string; porcentajeDescuento: number; umbralMinimo: number; categoriaId?: number | null; familiaId?: number | null; marcaId?: number | null; productoId?: number | null; varianteId?: number | null; clienteId?: number | null; vigenteDesde?: Date | null; vigenteHasta?: Date | null };

export function evaluateBestPromotion(input: { items: PromotionItem[]; rules: PromotionRule[]; clientId?: number | null; now?: Date }) {
  const now = input.now ?? new Date();
  const candidates = input.rules.flatMap((rule) => {
    if ((rule.vigenteDesde && rule.vigenteDesde > now) || (rule.vigenteHasta && rule.vigenteHasta < now) || (rule.clienteId && rule.clienteId !== input.clientId)) return [];
    const eligible = input.items.filter((item) => (!rule.categoriaId || item.categoriaId === rule.categoriaId) && (!rule.familiaId || item.familiaId === rule.familiaId) && (!rule.marcaId || item.marcaId === rule.marcaId) && (!rule.productoId || item.productoId === rule.productoId) && (!rule.varianteId || item.varianteId === rule.varianteId));
    const quantity = eligible.reduce((sum, item) => sum + item.cantidad, 0);
    const subtotal = eligible.reduce((sum, item) => sum + item.subtotal, 0);
    if (!eligible.length || (rule.tipo === "POR_MONTO" ? subtotal : quantity) < rule.umbralMinimo) return [];
    return [{ ruleId: rule.id, ruleName: rule.nombre, percentage: rule.porcentajeDescuento, amount: Math.round(subtotal * rule.porcentajeDescuento / 100) }];
  });
  return candidates.sort((a, b) => b.amount - a.amount || b.percentage - a.percentage)[0] ?? { ruleId: null, ruleName: null, percentage: 0, amount: 0 };
}
