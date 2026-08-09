import { prisma } from "@/lib/prisma";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function getLogisticsPageData() {
  const [sales, branches, employees] = await Promise.all([
    prisma.venta.findMany({
      where: { sucursal: { esPrincipal: true }, entrega: { isNot: null } },
      include: {
        detalles: { include: { producto: true } },
        cliente: true,
        sucursal: true,
        entrega: { include: { encargado: true, chofer: true, eventos: { orderBy: { creadoEn: "desc" } } } },
      },
      orderBy: { fecha: "desc" },
    }),
    getMainBranch().then((branch) => [branch]),
    prisma.usuario.findMany({ where: { activo: true, sucursal: { esPrincipal: true } }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ]);

  return { sales, branches, employees };
}
