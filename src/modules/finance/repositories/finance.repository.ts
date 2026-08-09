import { prisma } from "@/lib/prisma";

export async function getFinancePageData(filters?: { from?: string; to?: string; userId?: number; paymentMethod?: string }, now = new Date()) {
  const todayStart = filters?.from ? new Date(`${filters.from}T00:00:00`) : new Date(now);
  if (!filters?.from) todayStart.setHours(0, 0, 0, 0);
  const periodEnd = filters?.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;
  const dateFilter = { gte: todayStart, ...(periodEnd ? { lte: periodEnd } : {}) };
  const movementFilter = { creadoEn: dateFilter, ...(filters?.userId ? { usuarioId: filters.userId } : {}), ...(filters?.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) };

  const [sales, debtorCustomers, expenses, credits, movements] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: dateFilter, sucursal: { esPrincipal: true }, ...(filters?.userId ? { usuarioId: filters.userId } : {}), ...(filters?.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) },
      orderBy: { fecha: "desc" },
    }),
    prisma.cliente.findMany({
      where: { saldoDeudor: { gt: 0 }, sucursal: { esPrincipal: true } },
      orderBy: { saldoDeudor: "desc" },
    }),
    prisma.gasto.findMany({
      where: { fecha: dateFilter, sucursal: { esPrincipal: true }, ...(filters?.userId ? { usuarioId: filters.userId } : {}), ...(filters?.paymentMethod ? { metodoPago: filters.paymentMethod } : {}) },
      orderBy: { fecha: "desc" },
    }),
    prisma.creditoVenta.findMany({ where: { estado: "ACTIVO" }, include: { venta: { include: { cliente: true } }, cuotas: { where: { estado: { not: "PAGADA" } }, orderBy: { numero: "asc" } } }, orderBy: { creadoEn: "desc" } }),
    prisma.movimientoFinanciero.findMany({ where: movementFilter, include: { usuario: { select: { nombre: true } } }, orderBy: { creadoEn: "desc" } }),
  ]);
  const users = await prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } });
  return { sales, debtorCustomers, expenses, credits, movements, users };
}
