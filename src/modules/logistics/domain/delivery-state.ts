export const DELIVERY_STATES = ["PENDIENTE", "EN_PREPARACION", "LISTO_DESPACHO", "EN_CAMINO", "ENTREGADO", "ENTREGA_FALLIDA", "CANCELADO"] as const;
const TRANSITIONS: Record<string, string[]> = { PENDIENTE: ["EN_PREPARACION", "CANCELADO"], EN_PREPARACION: ["LISTO_DESPACHO", "CANCELADO"], LISTO_DESPACHO: ["EN_CAMINO", "CANCELADO"], EN_CAMINO: ["ENTREGADO", "ENTREGA_FALLIDA"], ENTREGA_FALLIDA: ["EN_PREPARACION", "CANCELADO"], ENTREGADO: [], CANCELADO: [] };

export function validateDeliveryTransition(from: string, to: string) {
  if (!DELIVERY_STATES.includes(to as (typeof DELIVERY_STATES)[number]) || !TRANSITIONS[from]?.includes(to)) throw new Error(`Transición de entrega inválida: ${from} → ${to}.`);
}
