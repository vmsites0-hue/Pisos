export function buildDeliverySnapshot(input: { deliveryType: string; customer: { nombre: string; apellido: string; razonSocial?: string | null; telefono?: string | null; direccion?: string | null } }) {
  if (input.deliveryType === "RETIRO") return null;
  if (input.deliveryType !== "ENVIO") throw new Error("Modalidad de entrega inválida.");
  return { estado: "PENDIENTE", clienteNombre: input.customer.razonSocial || `${input.customer.nombre} ${input.customer.apellido}`.trim(), clienteTelefono: input.customer.telefono ?? null, direccion: input.customer.direccion ?? null };
}
