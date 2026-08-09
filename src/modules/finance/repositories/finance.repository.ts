import { prisma } from "@/lib/prisma";

export async function getFinancePageData(now = new Date()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [sales, debtorCustomers, expenses, credits] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: { gte: todayStart }, sucursal: { esPrincipal: true } },
      orderBy: { fecha: "desc" },
    }),
    prisma.cliente.findMany({
      where: { saldoDeudor: { gt: 0 }, sucursal: { esPrincipal: true } },
      orderBy: { saldoDeudor: "desc" },
    }),
    prisma.gasto.findMany({
      where: { fecha: { gte: todayStart }, sucursal: { esPrincipal: true } },
      orderBy: { fecha: "desc" },
    }),
    prisma.creditoVenta.findMany({ where: { estado: "ACTIVO" }, include: { venta: { include: { cliente: true } }, cuotas: { where: { estado: { not: "PAGADA" } }, orderBy: { numero: "asc" } } }, orderBy: { creadoEn: "desc" } }),
  ]);

  return { sales, debtorCustomers, expenses, credits };
}
