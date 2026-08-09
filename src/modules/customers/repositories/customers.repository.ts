import { prisma } from "@/lib/prisma";

export function getCustomersPageData() {
  return prisma.cliente.findMany({
    where: { sucursal: { esPrincipal: true } },
    orderBy: { creadoEn: "desc" },
  });
}
