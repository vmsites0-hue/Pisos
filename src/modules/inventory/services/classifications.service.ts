import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";
import { classificationRemovalPolicy } from "@/modules/inventory/domain/classification-policy";

export type ClassificationKind = "FAMILIA" | "CATEGORIA" | "MARCA";

export async function getClassifications() {
  const [families, categories, brands] = await Promise.all([
    prisma.familia.findMany({ orderBy: { nombre: "asc" } }),
    prisma.categoria.findMany({ include: { familia: true }, orderBy: { nombre: "asc" } }),
    prisma.marca.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  return { families, categories, brands };
}

export async function createClassification(kind: ClassificationKind, name: string, familyId?: number) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const nombre = name.trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");

  const created = kind === "FAMILIA"
    ? await prisma.familia.create({ data: { nombre } })
    : kind === "MARCA"
      ? await prisma.marca.create({ data: { nombre } })
      : await prisma.categoria.create({ data: { nombre, familiaId: familyId || null } });

  await recordAudit({ userId: actor.id, action: `${kind}_CREADA`, entity: kind, entityId: created.id, after: created });
  revalidatePath("/configuracion");
  revalidatePath("/inventario");
}

export async function updateClassification(kind: ClassificationKind, id: number, name: string, active: boolean, familyId?: number) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const nombre = name.trim();
  if (!id || !nombre) throw new Error("Clasificación y nombre son obligatorios.");

  const before = kind === "FAMILIA"
    ? await prisma.familia.findUniqueOrThrow({ where: { id } })
    : kind === "MARCA"
      ? await prisma.marca.findUniqueOrThrow({ where: { id } })
      : await prisma.categoria.findUniqueOrThrow({ where: { id } });
  const updated = kind === "FAMILIA"
    ? await prisma.familia.update({ where: { id }, data: { nombre, activa: active } })
    : kind === "MARCA"
      ? await prisma.marca.update({ where: { id }, data: { nombre, activa: active } })
      : await prisma.categoria.update({ where: { id }, data: { nombre, activa: active, familiaId: familyId || null } });

  await recordAudit({ userId: actor.id, action: `${kind}_ACTUALIZADA`, entity: kind, entityId: id, before, after: updated });
  revalidatePath("/configuracion");
  revalidatePath("/inventario");
}

export async function removeClassification(kind: ClassificationKind, id: number) {
  const actor = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const usageCount = kind === "FAMILIA"
    ? await prisma.producto.count({ where: { familiaId: id } }) + await prisma.categoria.count({ where: { familiaId: id } })
    : kind === "MARCA"
      ? await prisma.producto.count({ where: { marcaId: id } })
      : await prisma.producto.count({ where: { categoriaId: id } });
  const policy = classificationRemovalPolicy(usageCount);

  if (kind === "FAMILIA") {
    if (policy === "DELETE") await prisma.familia.delete({ where: { id } });
    else await prisma.familia.update({ where: { id }, data: { activa: false } });
  } else if (kind === "MARCA") {
    if (policy === "DELETE") await prisma.marca.delete({ where: { id } });
    else await prisma.marca.update({ where: { id }, data: { activa: false } });
  } else if (policy === "DELETE") await prisma.categoria.delete({ where: { id } });
  else await prisma.categoria.update({ where: { id }, data: { activa: false } });

  await recordAudit({ userId: actor.id, action: `${kind}_${policy === "DELETE" ? "ELIMINADA" : "DESACTIVADA"}`, entity: kind, entityId: id, after: { usageCount, policy } });
  revalidatePath("/configuracion");
  revalidatePath("/inventario");
  return { policy };
}
