export function validateSaleCancellation(input: { estado: string; alreadyCancelled: boolean; reason: string }) {
  if (!input.reason.trim()) throw new Error("El motivo de cancelación es obligatorio.");
  if (input.alreadyCancelled || input.estado === "CANCELADA") throw new Error("La venta ya fue cancelada.");
  if (input.estado === "ENTREGADO") throw new Error("Una venta entregada debe procesarse como devolución.");
}
