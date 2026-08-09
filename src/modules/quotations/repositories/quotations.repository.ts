import { prisma } from "@/lib/prisma";

export async function getQuotationsPageData() {
  const [products, customers, categories, quotations] = await Promise.all([
    prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.cliente.findMany({ where: { sucursal: { esPrincipal: true } }, orderBy: { nombre: "asc" } }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.presupuesto.findMany({
      where: { sucursal: { esPrincipal: true } },
      include: {
        cliente: true,
        detalles: { include: { producto: true } },
      },
      orderBy: { fecha: "desc" },
    }),
  ]);

  return { products, customers, categories, quotations };
}
