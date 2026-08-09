import { prisma } from "@/lib/prisma";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function getSettingsPageData() {
  const [branches, discountRules, categories] = await Promise.all([
    getMainBranch().then((branch) => [branch]),
    prisma.reglaDescuento.findMany({ where: { sucursal: { esPrincipal: true } }, orderBy: { creadoEn: "desc" } }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return { branches, discountRules, categories };
}
