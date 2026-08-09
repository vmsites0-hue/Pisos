import { prisma } from "@/lib/prisma";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function getInventoryPageData() {
  const [products, categories, families, brands, branches, inventory] = await Promise.all([
    prisma.producto.findMany({
      include: { categoria: true, familia: true, marcaCatalogo: true, imagenes: { orderBy: { orden: "asc" } }, variantes: { include: { valores: { include: { atributo: true } } } } },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.categoria.findMany({ include: { familia: { include: { atributos: { where: { activo: true }, orderBy: { nombre: "asc" } } } } }, orderBy: { nombre: "asc" } }),
    prisma.familia.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
    prisma.marca.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
    getMainBranch().then((branch) => [branch]),
    prisma.inventario.findMany({
      where: { sucursal: { esPrincipal: true, activa: true } },
      include: { producto: true, sucursal: true },
      orderBy: { producto: { codigo: "asc" } },
    }),
  ]);

  return { products, categories, families, brands, branches, inventory };
}
