import { prisma } from "@/lib/prisma";

export async function getLogisticsPageData() {
  const [sales, branches] = await Promise.all([
    prisma.venta.findMany({
      include: {
        detalles: { include: { producto: true } },
        cliente: true,
        sucursal: true,
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.sucursal.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return { sales, branches };
}
