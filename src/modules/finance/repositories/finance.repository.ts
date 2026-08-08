import { prisma } from "@/lib/prisma";

export async function getFinancePageData(now = new Date()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [sales, debtorCustomers, expenses] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: { gte: todayStart } },
      orderBy: { fecha: "desc" },
    }),
    prisma.cliente.findMany({
      where: { saldoDeudor: { gt: 0 } },
      orderBy: { saldoDeudor: "desc" },
    }),
    prisma.gasto.findMany({
      where: { fecha: { gte: todayStart } },
      orderBy: { fecha: "desc" },
    }),
  ]);

  return { sales, debtorCustomers, expenses };
}
