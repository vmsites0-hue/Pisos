const PAYMENT_METHODS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CREDITO"];
const DELIVERY_TYPES = ["ENVIO", "RETIRO"];

export function validateSaleContract(input: { clienteId: number; metodoPago: string; tipoEntrega: string; detalles: Array<{ productoId: number; cantidad: number; precioUnitario: number }> }) {
  if (!Number.isInteger(input.clienteId) || input.clienteId <= 0) throw new Error("El cliente es obligatorio.");
  if (!PAYMENT_METHODS.includes(input.metodoPago)) throw new Error("El método de pago no es válido.");
  if (!DELIVERY_TYPES.includes(input.tipoEntrega)) throw new Error("La modalidad de entrega no es válida.");
  if (!input.detalles.length) throw new Error("La venta debe contener líneas.");
  if (input.detalles.some((line) => !Number.isInteger(line.productoId) || line.productoId <= 0 || !Number.isFinite(line.cantidad) || line.cantidad <= 0 || !Number.isFinite(line.precioUnitario) || line.precioUnitario < 0)) throw new Error("Las líneas contienen cantidades o precios inválidos.");
}
