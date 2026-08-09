import { prisma } from "@/lib/prisma";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function getLogisticsPageData() {
  const [sales, branches] = await Promise.all([
    prisma.venta.findMany({
      where: { sucursal: { esPrincipal: true } },
      include: {
        detalles: { include: { producto: true } },
        cliente: true,
        sucursal: true,
      },
      orderBy: { fecha: "desc" },
    }),
    getMainBranch().then((branch) => [branch]),
  ]);

  return { sales, branches };
}
