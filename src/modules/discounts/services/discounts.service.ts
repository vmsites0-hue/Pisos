import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export async function getReglasDescuento() {
  await requireAuthenticatedUser();
  return await prisma.reglaDescuento.findMany({
    where: { activa: true },
    orderBy: { creadoEn: "desc" },
  });
}

export async function createReglaDescuento(formData: FormData) {
  await requirePermission(PERMISSIONS.DISCOUNTS_MANAGE);
  const nombre = formData.get("nombre") as string;
  const tipo = formData.get("tipo") as string;
  const categoriaIdStr = formData.get("categoriaId") as string;
  const umbralMinimo = parseFloat(formData.get("umbralMinimo") as string);
  const porcentajeDescuento = parseFloat(formData.get("porcentajeDescuento") as string);

  if (!nombre || !tipo) return { error: "Nombre y tipo son requeridos." };
  if (isNaN(umbralMinimo) || isNaN(porcentajeDescuento)) return { error: "Umbral y porcentaje deben ser numéricos." };
  if (porcentajeDescuento <= 0 || porcentajeDescuento > 100) return { error: "El porcentaje debe estar entre 1 y 100." };

  try {
    const regla = await prisma.reglaDescuento.create({
      data: {
        nombre,
        tipo,
        categoriaId: categoriaIdStr ? parseInt(categoriaIdStr) : null,
        umbralMinimo,
        porcentajeDescuento,
        activa: true,
      },
    });
    revalidatePath("/configuracion");
    revalidatePath("/ventas");
    return { success: true, regla };
  } catch {
    return { error: "Error al crear la regla de descuento." };
  }
}

export async function deleteReglaDescuento(id: number) {
  await requirePermission(PERMISSIONS.DISCOUNTS_MANAGE);
  try {
    await prisma.reglaDescuento.delete({ where: { id } });
    revalidatePath("/configuracion");
    revalidatePath("/ventas");
    return { success: true };
  } catch {
    return { error: "Error al eliminar la regla." };
  }
}

export async function toggleReglaDescuento(id: number, activa: boolean) {
  await requirePermission(PERMISSIONS.DISCOUNTS_MANAGE);
  try {
    await prisma.reglaDescuento.update({
      where: { id },
      data: { activa },
    });
    revalidatePath("/configuracion");
    revalidatePath("/ventas");
    return { success: true };
  } catch {
    return { error: "Error al actualizar la regla." };
  }
}

// Evaluar las reglas automáticas sobre un carrito
export interface CartItemForDiscount {
  productoId: number;
  categoriaId: number;
  cantidad: number; // en m2 o unidades
  precioUnitario: number;
  subtotal: number;
}

export async function calcularDescuentoAutomatico(items: CartItemForDiscount[]) {
  await requireAuthenticatedUser();
  const reglas = await prisma.reglaDescuento.findMany({
    where: { activa: true },
  });

  if (reglas.length === 0 || items.length === 0) {
    return { porcentaje: 0, monto: 0, reglaAplicada: null };
  }

  const subtotalGeneral = items.reduce((acc, item) => acc + item.subtotal, 0);
  const cantidadTotalM2 = items.reduce((acc, item) => acc + item.cantidad, 0);

  let mejorDescuento = 0;
  let reglaAplicada: string | null = null;

  for (const regla of reglas) {
    let aplica = false;

    if (regla.tipo === "POR_VOLUMEN") {
      // Aplica si la cantidad total de m2 supera el umbral
      aplica = cantidadTotalM2 >= regla.umbralMinimo;
    } else if (regla.tipo === "POR_MONTO") {
      // Aplica si el subtotal general supera el umbral en Gs.
      aplica = subtotalGeneral >= regla.umbralMinimo;
    } else if (regla.tipo === "POR_CATEGORIA" && regla.categoriaId) {
      // Aplica si hay items de esa categoría cuya cantidad supera el umbral
      const cantidadCategoria = items
        .filter((it) => it.categoriaId === regla.categoriaId)
        .reduce((acc, it) => acc + it.cantidad, 0);
      aplica = cantidadCategoria >= regla.umbralMinimo;
    }

    if (aplica && regla.porcentajeDescuento > mejorDescuento) {
      mejorDescuento = regla.porcentajeDescuento;
      reglaAplicada = regla.nombre;
    }
  }

  const montoDescuento = Math.round(subtotalGeneral * (mejorDescuento / 100));

  return {
    porcentaje: mejorDescuento,
    monto: montoDescuento,
    reglaAplicada,
  };
}
