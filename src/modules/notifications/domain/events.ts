export const NOTIFICATION_EVENTS = ["NUEVO_PEDIDO", "ENTREGA_ASIGNADA", "PEDIDO_LISTO", "STOCK_CRITICO", "RESERVA_PROXIMA_VENCER", "RESERVA_LIBERADA", "SOLICITUD_APROBACION", "RESULTADO_APROBACION", "VARIACION_PRESUPUESTO", "ENTREGA_FALLIDA"] as const;
export function notificationKey(event: string, entity: string | number, recipientId: number, sequence = 1) {
  if (!event || !String(entity) || recipientId <= 0 || sequence <= 0) throw new Error("La clave de notificación es inválida.");
  return `${event}:${entity}:${recipientId}:${sequence}`;
}
