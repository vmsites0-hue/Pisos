"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSucursal(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string;
  const telefono = formData.get("telefono") as string;

  if (!nombre) return { error: "El nombre es requerido" };

  await prisma.sucursal.create({
    data: {
      nombre,
      direccion,
      telefono,
      activa: true,
    },
  });

  revalidatePath("/configuracion");
  return { success: true };
}

export async function updateSucursal(id: number, formData: FormData) {
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
  try {
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
  try {
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
