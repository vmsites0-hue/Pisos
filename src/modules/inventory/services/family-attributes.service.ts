import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";
import { normalizeAttributeKey, validateAttributeDefinition } from "@/modules/inventory/domain/family-attribute";

export async function getFamilyAttributes() {
  return prisma.atributoFamilia.findMany({ include: { familia: true }, orderBy: [{ familia: { nombre: "asc" } }, { nombre: "asc" }] });
}

export async function saveFamilyAttribute(input: {
  id?: number; familyId: number; name: string; type: string; required: boolean; filterable: boolean; identity: boolean; options: string[]; active: boolean;
}) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const nombre = input.name.trim();
  const clave = normalizeAttributeKey(nombre);
  if (!input.familyId || !nombre || !clave || !validateAttributeDefinition(input.type, input.options)) throw new Error("Definición de atributo inválida.");
  const data = {
    familiaId: input.familyId,
    clave,
    nombre,
    tipo: input.type,
    obligatorio: input.required,
    filtrable: input.filterable,
    identidad: input.identity,
    opciones: input.type === "SELECCION" ? JSON.stringify(input.options.map((item) => item.trim()).filter(Boolean)) : null,
    activo: input.active,
  };
  const before = input.id ? await prisma.atributoFamilia.findUnique({ where: { id: input.id } }) : null;
  const saved = input.id
    ? await prisma.atributoFamilia.update({ where: { id: input.id }, data })
    : await prisma.atributoFamilia.create({ data });
  await recordAudit({ userId: actor.id, action: input.id ? "ATRIBUTO_ACTUALIZADO" : "ATRIBUTO_CREADO", entity: "AtributoFamilia", entityId: saved.id, before, after: saved });
  revalidatePath("/configuracion");
}

export async function deactivateFamilyAttribute(id: number) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const before = await prisma.atributoFamilia.findUniqueOrThrow({ where: { id } });
  const after = await prisma.atributoFamilia.update({ where: { id }, data: { activo: false } });
  await recordAudit({ userId: actor.id, action: "ATRIBUTO_DESACTIVADO", entity: "AtributoFamilia", entityId: id, before, after });
  revalidatePath("/configuracion");
}
