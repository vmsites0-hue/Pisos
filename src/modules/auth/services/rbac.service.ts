import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { hashPassword } from "@/modules/auth/domain/password";
import { requirePermission } from "@/modules/auth/services/access.service";
import { recordAudit } from "@/modules/audit/services/audit.service";

function positiveIds(formData: FormData, field: string) {
  return formData.getAll(field).map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

export async function createUser(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleIds = positiveIds(formData, "roleIds");

  if (!nombre || !email || password.length < 10 || roleIds.length === 0) {
    throw new Error("Nombre, correo, contraseña de 10 caracteres y al menos un rol son obligatorios.");
  }

  const mainBranch = await prisma.sucursal.findFirstOrThrow({ where: { activa: true } });
  const created = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: await hashPassword(password),
      sucursalId: mainBranch.id,
      roles: { create: roleIds.map((rolId) => ({ rolId })) },
    },
  });
  await recordAudit({ userId: actor.id, action: "USUARIO_CREADO", entity: "Usuario", entityId: created.id, after: created });
  revalidatePath("/configuracion");
}

export async function renameRole(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.ROLES_MANAGE);
  const id = Number(formData.get("roleId"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!id || !nombre) throw new Error("Rol y nombre son obligatorios.");
  const before = await prisma.rol.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.rol.update({ where: { id }, data: { nombre } });
  await recordAudit({ userId: actor.id, action: "ROL_RENOMBRADO", entity: "Rol", entityId: id, before, after: updated });
  revalidatePath("/configuracion");
}

export async function setRolePermissions(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.ROLES_MANAGE);
  const roleId = Number(formData.get("roleId"));
  const permissionIds = positiveIds(formData, "permissionIds");
  if (!roleId) throw new Error("Rol inválido.");

  await prisma.$transaction(async (tx) => {
    const before = await tx.rolPermiso.findMany({ where: { rolId: roleId } });
    await tx.rolPermiso.deleteMany({ where: { rolId: roleId } });
    if (permissionIds.length) {
      await tx.rolPermiso.createMany({
        data: permissionIds.map((permisoId) => ({ rolId: roleId, permisoId })),
      });
    }
    await recordAudit({ userId: actor.id, action: "PERMISOS_ROL_ACTUALIZADOS", entity: "Rol", entityId: roleId, before, after: permissionIds }, tx);
  });
  revalidatePath("/configuracion");
}

export async function assignUserRoles(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const userId = Number(formData.get("userId"));
  const roleIds = positiveIds(formData, "roleIds");
  if (!userId || roleIds.length === 0) throw new Error("El usuario debe conservar al menos un rol.");

  await prisma.$transaction(async (tx) => {
    const before = await tx.usuarioRol.findMany({ where: { usuarioId: userId } });
    await tx.usuarioRol.deleteMany({ where: { usuarioId: userId } });
    await tx.usuarioRol.createMany({
      data: roleIds.map((rolId) => ({ usuarioId: userId, rolId })),
    });
    await recordAudit({ userId: actor.id, action: "ROLES_USUARIO_ACTUALIZADOS", entity: "Usuario", entityId: userId, before, after: roleIds }, tx);
  });
  revalidatePath("/configuracion");
}
