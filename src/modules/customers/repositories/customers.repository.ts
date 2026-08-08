import { prisma } from "@/lib/prisma";

export function getCustomersPageData() {
  return prisma.cliente.findMany({
    orderBy: { creadoEn: "desc" },
  });
}
