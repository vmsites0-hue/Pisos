import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCategoria(nombre: string) {
  const normalizedNombre = nombre.trim();
  if (!normalizedNombre) {
    return { error: "El nombre de la categoría es requerido." };
  }

  try {
    const existe = await prisma.categoria.findUnique({
      where: { nombre: normalizedNombre },
    });

    if (existe) {
      return { error: "La categoría ya existe." };
    }

    const nueva = await prisma.categoria.create({
      data: {
        nombre: normalizedNombre,
      },
    });

    revalidatePath("/inventario");
    return { success: true, category: nueva };
  } catch (error: any) {
    return { error: error.message || "Error al crear la categoría." };
  }
}

export async function deleteCategoria(id: number) {
  try {
    // Verificar si tiene productos asociados
    const productosCount = await prisma.producto.count({
      where: { categoriaId: id },
    });

    if (productosCount > 0) {
      return { error: "No se puede eliminar la categoría porque tiene productos asociados." };
    }

    await prisma.categoria.delete({
      where: { id },
    });

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar la categoría." };
  }
}
