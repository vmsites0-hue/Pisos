import { prisma } from "@/lib/prisma";
import { toCsv, type REPORT_DATASETS } from "../domain/csv";

type Dataset = (typeof REPORT_DATASETS)[number];
export async function exportReport(dataset: Dataset, filters: { from?: Date; to?: Date; userId?: number; paymentMethod?: string }) {
  const date = filters.from || filters.to ? { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } : undefined;
  if (dataset === "inventario") {
    const data = await prisma.inventario.findMany({ where: { sucursal: { esPrincipal: true } }, include: { variante: { include: { producto: true, unidadBase: true } } }, orderBy: { id: "asc" } });
    return toCsv(["SKU", "Producto", "Unidad", "Stock actual", "Reservado", "Disponible", "Mínimo"], data.map((item) => [item.variante?.sku, item.variante?.producto.nombre, item.variante?.unidadBase?.codigo, item.stockActual, item.stockReservado, item.stockActual - item.stockReservado, item.variante?.stockMinimo]));
  }
  if (dataset === "ventas") {
    const data = await prisma.venta.findMany({ where: { sucursal: { esPrincipal: true }, ...(date ? { fecha: date } : {}), ...(filters.userId ? { usuarioId: filters.userId } : {}), ...(filters.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) }, include: { cliente: true, usuario: true }, orderBy: { fecha: "desc" } });
    return toCsv(["Venta", "Fecha", "Cliente", "Empleado", "Método", "Subtotal", "Descuento", "Total", "Estado"], data.map((item) => [item.id, item.fecha.toISOString(), `${item.cliente.nombre} ${item.cliente.apellido}`, item.usuario.nombre, item.metodoPago, item.subtotal, item.descuento, item.total, item.estado]));
  }
  if (dataset === "gastos") {
    const data = await prisma.gasto.findMany({ where: { sucursal: { esPrincipal: true }, ...(date ? { fecha: date } : {}), ...(filters.userId ? { usuarioId: filters.userId } : {}), ...(filters.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) }, include: { usuario: true }, orderBy: { fecha: "desc" } });
    return toCsv(["Gasto", "Fecha", "Descripción", "Categoría", "Empleado", "Método", "Importe", "Estado", "Comprobante"], data.map((item) => [item.id, item.fecha.toISOString(), item.descripcion, item.categoria, item.usuario?.nombre, item.metodoPago, item.monto, item.estado, item.comprobanteUrl]));
  }
  if (dataset === "cuentas-por-cobrar") {
    const data = await prisma.cliente.findMany({ where: { sucursal: { esPrincipal: true }, saldoDeudor: { gt: 0 } }, orderBy: { saldoDeudor: "desc" } });
    return toCsv(["Cliente", "Documento", "Teléfono", "Saldo", "Límite"], data.map((item) => [`${item.nombre} ${item.apellido}`, item.documento, item.telefono, item.saldoDeudor, item.limiteCredito]));
  }
  const data = await prisma.entrega.findMany({ where: { ...(date ? { creadaEn: date } : {}), ...(filters.userId ? { OR: [{ encargadoId: filters.userId }, { choferId: filters.userId }] } : {}) }, include: { venta: { include: { cliente: true } }, encargado: true, chofer: true }, orderBy: { creadaEn: "desc" } });
  return toCsv(["Venta", "Fecha", "Cliente", "Encargado", "Chofer", "Estado", "Dirección", "Observaciones"], data.map((item) => [item.ventaId, item.creadaEn.toISOString(), `${item.venta.cliente.nombre} ${item.venta.cliente.apellido}`, item.encargado?.nombre, item.chofer?.nombre, item.estado, item.direccion, item.observaciones]));
}
