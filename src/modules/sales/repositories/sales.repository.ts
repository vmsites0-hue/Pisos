import { prisma } from "@/lib/prisma";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function getSalesPageData() {
  const [branches, categories, customers, products, inventory] = await Promise.all([
    getMainBranch().then((branch) => [branch]),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.cliente.findMany({ where: { sucursal: { esPrincipal: true } }, orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({ orderBy: { nombre: "asc" } }),
    prisma.inventario.findMany({
      include: { producto: true, sucursal: true },
      where: { stockActual: { gt: 0 }, sucursal: { esPrincipal: true, activa: true } },
      orderBy: { producto: { codigo: "asc" } },
    }),
  ]);

  return { branches, categories, customers, products, inventory };
}
