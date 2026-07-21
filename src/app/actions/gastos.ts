"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function registrarGasto(formData: FormData) {
  try {
    const descripcion = (formData.get("descripcion") as string)?.trim();
    const monto = parseFloat(formData.get("monto") as string);
    const categoria = (formData.get("categoria") as string)?.trim() || null;

    if (!descripcion || isNaN(monto) || monto <= 0) {
      return { error: "Faltan datos obligatorios o el monto es inválido." };
    }

    await prisma.gasto.create({
      data: {
        descripcion,
        monto,
        categoria,
      },
    });

    revalidatePath("/finanzas");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al registrar el gasto." };
  }
}

export async function eliminarGasto(id: number) {
  try {
    await prisma.gasto.delete({
      where: { id },
    });

    revalidatePath("/finanzas");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el gasto." };
  }
}
