import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";

export async function createSucursal(formData: FormData) {
  await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  void formData;
  return { error: "El MVP opera con un único local principal y no permite crear otro." };
}

export async function updateSucursal(id: number, formData: FormData) {
  await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string;
  const telefono = formData.get("telefono") as string;

  if (!nombre) return { error: "El nombre es requerido" };

  try {
    await prisma.sucursal.update({
      where: { id },
      data: { nombre, direccion, telefono },
    });
    revalidatePath("/configuracion");
    return { success: true };
  } catch {
    return { error: "No se pudo actualizar la sucursal." };
  }
}

export async function deleteSucursal(id: number) {
  await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  try {
    const target = await prisma.sucursal.findUniqueOrThrow({ where: { id } });
    if (target.esPrincipal) return { error: "El local principal no puede eliminarse." };
    // Verificar que no tenga inventario asociado
    const invCount = await prisma.inventario.count({ where: { sucursalId: id } });
    if (invCount > 0) {
      return { error: "No se puede eliminar esta sucursal porque tiene inventario asociado. Transfiere o elimina el stock primero." };
    }

    const ventaCount = await prisma.venta.count({ where: { sucursalId: id } });
    if (ventaCount > 0) {
      // En vez de eliminar, desactivar
      await prisma.sucursal.update({
        where: { id },
        data: { activa: false },
      });
      revalidatePath("/configuracion");
      return { success: true, message: "Sucursal desactivada (tiene ventas históricas)." };
    }

    await prisma.sucursal.delete({ where: { id } });
    revalidatePath("/configuracion");
    return { success: true };
  } catch {
    return { error: "No se pudo eliminar la sucursal." };
  }
}

export async function toggleSucursal(id: number, activa: boolean) {
  await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  try {
    const target = await prisma.sucursal.findUniqueOrThrow({ where: { id } });
    if (target.esPrincipal && !activa) return { error: "El local principal no puede desactivarse." };
    await prisma.sucursal.update({
      where: { id },
      data: { activa },
    });
    revalidatePath("/configuracion");
    return { success: true };
  } catch {
    return { error: "No se pudo actualizar el estado." };
  }
}
