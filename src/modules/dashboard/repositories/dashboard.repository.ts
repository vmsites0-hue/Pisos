import { prisma } from "@/lib/prisma";

export async function getDashboardData(now = new Date()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [todaySales, pendingOrders, products, newCustomers, recentSales] = await Promise.all([
    prisma.venta.findMany({ where: { fecha: { gte: todayStart }, sucursal: { esPrincipal: true } } }),
    prisma.venta.count({ where: { estado: "PENDIENTE", sucursal: { esPrincipal: true } } }),
    prisma.producto.findMany({
      include: { inventarios: true, categoria: true },
    }),
    prisma.cliente.count({ where: { creadoEn: { gte: todayStart }, sucursal: { esPrincipal: true } } }),
    prisma.venta.findMany({
      where: { sucursal: { esPrincipal: true } },
      take: 5,
      orderBy: { fecha: "desc" },
      include: { cliente: true, sucursal: true },
    }),
  ]);

  return { todaySales, pendingOrders, products, newCustomers, recentSales };
}
