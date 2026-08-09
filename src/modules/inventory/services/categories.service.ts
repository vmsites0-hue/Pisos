import { prisma } from "@/lib/prisma";
import { createClassification, removeClassification } from "@/modules/inventory/services/classifications.service";

export async function createCategoria(nombre: string) {
  try {
    const fallbackFamily = await prisma.familia.findUnique({ where: { nombre: "Otros" } });
    await createClassification("CATEGORIA", nombre, fallbackFamily?.id);
    const category = await prisma.categoria.findUniqueOrThrow({ where: { nombre: nombre.trim() } });
    return { success: true, category };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al crear la categoría." };
  }
}

export async function deleteCategoria(id: number) {
  try {
    const result = await removeClassification("CATEGORIA", id);
    return { success: true, message: result.policy === "DEACTIVATE" ? "Categoría desactivada porque está en uso." : "Categoría eliminada." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al eliminar la categoría." };
  }
}
