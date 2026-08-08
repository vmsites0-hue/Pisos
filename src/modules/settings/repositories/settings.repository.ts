import { prisma } from "@/lib/prisma";

export async function getSettingsPageData() {
  const [branches, discountRules, categories] = await Promise.all([
    prisma.sucursal.findMany({ orderBy: { creadoEn: "desc" } }),
    prisma.reglaDescuento.findMany({ orderBy: { creadoEn: "desc" } }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return { branches, discountRules, categories };
}
