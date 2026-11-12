import { prisma } from "@/lib/prisma";

export async function getFinancePageData(filters?: { from?: string; to?: string; userId?: number; paymentMethod?: string }, now = new Date()) {
  const todayStart = filters?.from ? new Date(`${filters.from}T00:00:00`) : new Date(now);
  if (!filters?.from) todayStart.setHours(0, 0, 0, 0);
  const periodEnd = filters?.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;
  const dateFilter = { gte: todayStart, ...(periodEnd ? { lte: periodEnd } : {}) };
  const movementFilter = { creadoEn: dateFilter, ...(filters?.userId ? { usuarioId: filters.userId } : {}), ...(filters?.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) };

  const [sales, debtorCustomers, expenses, credits, movements, closures] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: dateFilter, sucursal: { esPrincipal: true }, ...(filters?.userId ? { usuarioId: filters.userId } : {}), ...(filters?.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) },
      orderBy: { fecha: "desc" },
    }),
    prisma.cliente.findMany({
      where: { saldoDeudor: { gt: 0 }, sucursal: { esPrincipal: true } },
      include: { deudas: { where: { estado: "PENDIENTE" }, orderBy: { fechaDeuda: "asc" } } },
      orderBy: { saldoDeudor: "desc" },
    }),
    prisma.gasto.findMany({
      where: { fecha: dateFilter, sucursal: { esPrincipal: true }, ...(filters?.userId ? { usuarioId: filters.userId } : {}), ...(filters?.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) },
      orderBy: { fecha: "desc" },
    }),
    prisma.creditoVenta.findMany({ where: { estado: "ACTIVO" }, include: { venta: { include: { cliente: true } }, cuotas: { where: { estado: { not: "PAGADA" } }, orderBy: { numero: "asc" } } }, orderBy: { creadoEn: "desc" } }),
    prisma.movimientoFinanciero.findMany({ where: movementFilter, include: { usuario: { select: { nombre: true } } }, orderBy: { creadoEn: "desc" } }),
    prisma.cierreCaja.findMany({ include: { responsable: { select: { nombre: true } } }, orderBy: { cerradoEn: "desc" }, take: 20 }),
  ]);
  const allCustomers = await prisma.cliente.findMany({ where: { activo: true, sucursal: { esPrincipal: true } }, select: { id: true, nombre: true, apellido: true, documento: true }, orderBy: [{ nombre: "asc" }, { apellido: "asc" }] });
  const users = await prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } });

  // Saldo inicial: lo declarado en el último cierre confirmado anterior al período
  // + los movimientos de caja posteriores a ese cierre y anteriores al período.
  const lastClosure = await prisma.cierreCaja.findFirst({ where: { estado: "CERRADO", periodoHasta: { lt: todayStart } }, orderBy: { periodoHasta: "desc" } });
  const earlier = await prisma.movimientoFinanciero.findMany({
    where: { afectaCaja: true, creadoEn: { lt: todayStart, ...(lastClosure ? { gt: lastClosure.periodoHasta } : {}) } },
    select: { tipo: true, importe: true },
  });
  const openingBalance = (lastClosure?.importeDeclarado ?? 0) + earlier.reduce((sum, item) => sum + (item.tipo === "INGRESO" ? item.importe : -item.importe), 0);
  return { sales, debtorCustomers, expenses, credits, movements, closures, users, openingBalance, allCustomers };
}
