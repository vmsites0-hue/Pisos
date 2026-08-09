import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { isApprovalType, type ApprovalType } from "@/modules/approvals/domain/approval-types";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function requestApproval(input: {
  type: string;
  reason: string;
  entity?: string;
  entityId?: string;
  previousValues?: unknown;
  proposedValues: unknown;
}) {
  const user = await requireAuthenticatedUser();
  if (!isApprovalType(input.type) || !input.reason.trim()) throw new Error("Tipo y motivo son obligatorios.");

  const request = await prisma.solicitudAprobacion.create({
    data: {
      tipo: input.type,
      motivo: input.reason.trim(),
      entidad: input.entity,
      entidadId: input.entityId,
      valoresAntes: input.previousValues === undefined ? null : JSON.stringify(input.previousValues),
      valoresPropuestos: JSON.stringify(input.proposedValues),
      solicitanteId: user.id,
    },
  });
  await recordAudit({ userId: user.id, action: "SOLICITUD_CREADA", entity: "SolicitudAprobacion", entityId: request.id, after: request });
  revalidatePath("/aprobaciones");
  return request;
}

export async function approveRequest(id: number) {
  const approver = await requirePermission(PERMISSIONS.APPROVALS_REVIEW);
  const [request, policy] = await Promise.all([
    prisma.solicitudAprobacion.findUniqueOrThrow({ where: { id } }),
    prisma.politicaAprobacion.findUnique({ where: { id: 1 } }),
  ]);

  if (request.estado !== "PENDIENTE") throw new Error("La solicitud ya fue resuelta.");
  if (!policy?.permitirAutoAprobacion && request.solicitanteId === approver.id) {
    throw new Error("No podés aprobar tu propia solicitud.");
  }

  const result = await prisma.solicitudAprobacion.updateMany({
    where: { id, estado: "PENDIENTE" },
    data: { estado: "APROBADA", aprobadorId: approver.id, resueltoEn: new Date() },
  });
  if (result.count !== 1) throw new Error("La solicitud fue resuelta por otro usuario.");
  await recordAudit({ userId: approver.id, action: "SOLICITUD_APROBADA", entity: "SolicitudAprobacion", entityId: id, before: request, after: { estado: "APROBADA" } });
  revalidatePath("/aprobaciones");
}

export async function rejectRequest(id: number) {
  const approver = await requirePermission(PERMISSIONS.APPROVALS_REVIEW);
  const result = await prisma.solicitudAprobacion.updateMany({
    where: { id, estado: "PENDIENTE" },
    data: { estado: "RECHAZADA", aprobadorId: approver.id, resueltoEn: new Date() },
  });
  if (result.count !== 1) throw new Error("La solicitud ya fue resuelta.");
  await recordAudit({ userId: approver.id, action: "SOLICITUD_RECHAZADA", entity: "SolicitudAprobacion", entityId: id, after: { estado: "RECHAZADA" } });
  revalidatePath("/aprobaciones");
}

export async function updateSelfApprovalPolicy(enabled: boolean) {
  await requirePermission(PERMISSIONS.APPROVALS_POLICY_MANAGE);
  await prisma.politicaAprobacion.upsert({
    where: { id: 1 },
    update: { permitirAutoAprobacion: enabled },
    create: { id: 1, permitirAutoAprobacion: enabled },
  });
  revalidatePath("/aprobaciones");
}

export async function consumeApproval<T>(
  id: number,
  expectedType: ApprovalType,
  operation: (tx: Prisma.TransactionClient, proposedValues: unknown) => Promise<T>,
) {
  const user = await requireAuthenticatedUser();

  return prisma.$transaction(async (tx) => {
    const request = await tx.solicitudAprobacion.findUniqueOrThrow({ where: { id } });
    if (
      request.solicitanteId !== user.id ||
      request.tipo !== expectedType ||
      request.estado !== "APROBADA" ||
      request.ejecutadoEn
    ) {
      throw new Error("La autorización no es válida o ya fue utilizada.");
    }

    const reserved = await tx.solicitudAprobacion.updateMany({
      where: { id, estado: "APROBADA", ejecutadoEn: null },
      data: { estado: "EJECUTADA", ejecutadoEn: new Date() },
    });
    if (reserved.count !== 1) throw new Error("La autorización ya fue utilizada.");

    const values = JSON.parse(request.valoresPropuestos) as unknown;
    const result = await operation(tx, values);
    await recordAudit({ userId: user.id, action: "AUTORIZACION_CONSUMIDA", entity: "SolicitudAprobacion", entityId: id, after: { estado: "EJECUTADA" } }, tx);
    return result;
  });
}
