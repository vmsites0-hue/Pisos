import { prisma } from "@/lib/prisma";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function getInventoryPageData() {
  const [products, categories, branches, inventory] = await Promise.all([
    prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    getMainBranch().then((branch) => [branch]),
    prisma.inventario.findMany({
      where: { sucursal: { esPrincipal: true, activa: true } },
      include: { producto: true, sucursal: true },
      orderBy: { producto: { codigo: "asc" } },
    }),
  ]);

  return { products, categories, branches, inventory };
}
