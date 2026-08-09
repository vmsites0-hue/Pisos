export function buildDeliveryNote(input: { saleId: number; delivery: { clienteNombre: string; clienteTelefono: string | null; direccion: string | null; observaciones: string | null; encargado?: { nombre: string } | null; chofer?: { nombre: string } | null }; lines: Array<{ name: string; quantity: number; unit: string }> }) {
  if (!input.lines.length) throw new Error("La nota debe contener mercadería.");
  return { number: `NE-${input.saleId}`, customer: input.delivery.clienteNombre, phone: input.delivery.clienteTelefono, address: input.delivery.direccion, manager: input.delivery.encargado?.nombre ?? null, driver: input.delivery.chofer?.nombre ?? null, observations: input.delivery.observaciones, lines: input.lines, fiscal: false };
}
