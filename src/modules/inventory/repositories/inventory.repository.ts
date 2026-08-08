import { prisma } from "@/lib/prisma";

export async function getInventoryPageData() {
  const [products, categories, branches, inventory] = await Promise.all([
    prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.sucursal.findMany({ orderBy: { nombre: "asc" } }),
    prisma.inventario.findMany({
      include: { producto: true, sucursal: true },
      orderBy: { producto: { codigo: "asc" } },
    }),
  ]);

  return { products, categories, branches, inventory };
}
