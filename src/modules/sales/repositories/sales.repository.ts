import { prisma } from "@/lib/prisma";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function getSalesPageData() {
  const [branches, categories, customers, products, inventory, creditPlans] = await Promise.all([
    getMainBranch().then((branch) => [branch]),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.cliente.findMany({ where: { activo: true, sucursal: { esPrincipal: true } }, orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({ orderBy: { nombre: "asc" } }),
    prisma.inventario.findMany({
      include: { producto: { include: { marcaCatalogo: true } }, variante: { include: { valores: true, presentaciones: { where: { activa: true }, include: { unidad: true } } } }, sucursal: true },
      where: { stockActual: { gt: 0 }, sucursal: { esPrincipal: true, activa: true } },
      orderBy: { producto: { codigo: "asc" } },
    }),
    prisma.planCredito.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  return { branches, categories, customers, products, inventory, creditPlans };
}
