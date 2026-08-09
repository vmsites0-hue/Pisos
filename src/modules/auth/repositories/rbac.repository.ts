import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";

export async function getRbacSettingsData() {
  await requirePermission(PERMISSIONS.ROLES_MANAGE);

  const [roles, permissions, users] = await Promise.all([
    prisma.rol.findMany({
      include: { permisos: { include: { permiso: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.permiso.findMany({ orderBy: { descripcion: "asc" } }),
    prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        roles: { include: { rol: true } },
      },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return { roles, permissions, users };
}
