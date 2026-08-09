import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { hasPermission } from "@/modules/auth/services/access.service";

export async function getApprovalsPageData() {
  const user = await requireAuthenticatedUser();
  const canReview = await hasPermission(PERMISSIONS.APPROVALS_REVIEW);
  const [requests, policy] = await Promise.all([
    prisma.solicitudAprobacion.findMany({
      where: canReview
        ? { OR: [{ estado: "PENDIENTE" }, { solicitanteId: user.id }] }
        : { solicitanteId: user.id },
      include: {
        solicitante: { select: { id: true, nombre: true } },
        aprobador: { select: { id: true, nombre: true } },
      },
      orderBy: { solicitadoEn: "desc" },
    }),
    prisma.politicaAprobacion.findUnique({ where: { id: 1 } }),
  ]);
  return { requests, policy, currentUserId: user.id, canReview };
}
