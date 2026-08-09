import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeAuditData } from "@/modules/audit/domain/sanitize-audit-data";

export interface AuditInput {
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  before?: unknown;
  after?: unknown;
}

export async function recordAudit(input: AuditInput, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.registroAuditoria.create({
    data: {
      usuarioId: input.userId ?? null,
      accion: input.action,
      entidad: input.entity,
      entidadId: input.entityId == null ? null : String(input.entityId),
      datosAntes: input.before === undefined ? null : JSON.stringify(sanitizeAuditData(input.before)),
      datosDespues: input.after === undefined ? null : JSON.stringify(sanitizeAuditData(input.after)),
    },
  });
}
