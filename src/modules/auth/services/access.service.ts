import { prisma } from "@/lib/prisma";
import type { PermissionCode } from "@/modules/auth/domain/permissions";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export class AuthorizationError extends Error {
  constructor() {
    super("No tenés permiso para realizar esta operación.");
    this.name = "AuthorizationError";
  }
}

export async function requirePermission(permissionCode: PermissionCode) {
  const user = await requireAuthenticatedUser();
  const assignment = await prisma.usuarioRol.findFirst({
    where: {
      usuarioId: user.id,
      rol: {
        activo: true,
        permisos: { some: { permiso: { codigo: permissionCode } } },
      },
    },
  });

  if (!assignment) throw new AuthorizationError();
  return user;
}

export async function hasPermission(permissionCode: PermissionCode) {
  try {
    await requirePermission(permissionCode);
    return true;
  } catch (error) {
    if (error instanceof AuthorizationError) return false;
    throw error;
  }
}
