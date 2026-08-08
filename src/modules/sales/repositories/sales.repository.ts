import { prisma } from "@/lib/prisma";

export async function getSalesPageData() {
  const [branches, categories, customers, products, inventory] = await Promise.all([
    prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({ orderBy: { nombre: "asc" } }),
    prisma.inventario.findMany({
      include: { producto: true, sucursal: true },
      where: { stockActual: { gt: 0 } },
      orderBy: { producto: { codigo: "asc" } },
    }),
  ]);

  return { branches, categories, customers, products, inventory };
}
