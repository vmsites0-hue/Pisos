import { prisma } from "@/lib/prisma";
import { assertSingleMainBranch } from "@/modules/branches/domain/main-branch";

export async function getMainBranch() {
  const branches = await prisma.sucursal.findMany({ where: { esPrincipal: true } });
  return assertSingleMainBranch(branches);
}
