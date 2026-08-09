import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";
import { validateUnit } from "@/modules/inventory/domain/unit";

export function getUnits() {
  return prisma.unidadMedida.findMany({ orderBy: { nombre: "asc" } });
}

export async function saveUnit(input: { id?: number; code: string; name: string; symbol: string; precision: number; decimals: boolean; active: boolean }) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const data = { codigo: input.code.trim().toUpperCase(), nombre: input.name.trim(), simbolo: input.symbol.trim(), precision: input.precision, admiteDecimales: input.decimals, activa: input.active };
  validateUnit(data);
  const before = input.id ? await prisma.unidadMedida.findUnique({ where: { id: input.id } }) : null;
  const saved = input.id ? await prisma.unidadMedida.update({ where: { id: input.id }, data }) : await prisma.unidadMedida.create({ data });
  await recordAudit({ userId: actor.id, action: input.id ? "UNIDAD_ACTUALIZADA" : "UNIDAD_CREADA", entity: "UnidadMedida", entityId: saved.id, before, after: saved });
  revalidatePath("/configuracion");
}

export async function deactivateUnit(id: number) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const before = await prisma.unidadMedida.findUniqueOrThrow({ where: { id } });
  const after = await prisma.unidadMedida.update({ where: { id }, data: { activa: false } });
  await recordAudit({ userId: actor.id, action: "UNIDAD_DESACTIVADA", entity: "UnidadMedida", entityId: id, before, after });
  revalidatePath("/configuracion");
}
