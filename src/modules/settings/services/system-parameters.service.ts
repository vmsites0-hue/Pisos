import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";
import { buildParameterSnapshot, parameterDefinition, validateParameterValue } from "@/modules/settings/domain/system-parameters";

export async function getSystemParameters() {
  return prisma.parametroSistema.findMany({ orderBy: { clave: "asc" } });
}

export async function getSystemParameterSnapshot() {
  const parameters = await getSystemParameters();
  return buildParameterSnapshot(parameters);
}

export async function updateSystemParameter(key: string, value: string) {
  const actor = await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const definition = parameterDefinition(key);
  if (!definition || !validateParameterValue(definition, value)) {
    throw new Error("El valor no cumple la validación del parámetro.");
  }

  const before = await prisma.parametroSistema.findUniqueOrThrow({ where: { clave: key } });
  const updated = await prisma.parametroSistema.update({ where: { clave: key }, data: { valor: value } });
  await recordAudit({ userId: actor.id, action: "PARAMETRO_ACTUALIZADO", entity: "ParametroSistema", entityId: key, before, after: updated });
  revalidatePath("/configuracion");
}
