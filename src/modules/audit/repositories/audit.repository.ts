import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";

export async function getAuditRecords(limit = 200) {
  await requirePermission(PERMISSIONS.AUDIT_VIEW);
  return prisma.registroAuditoria.findMany({
    include: { usuario: { select: { nombre: true, email: true } } },
    orderBy: { creadoEn: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });
}
