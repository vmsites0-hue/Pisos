import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { evaluateBestPromotion } from "@/modules/discounts/domain/promotion-engine";

export async function getReglasDescuento() {
  await requireAuthenticatedUser();
  const mainBranch = await getMainBranch();
  return await prisma.reglaDescuento.findMany({
    where: { activa: true, sucursalId: mainBranch.id },
    orderBy: { creadoEn: "desc" },
  });
}

export async function createReglaDescuento(formData: FormData) {
  await requirePermission(PERMISSIONS.DISCOUNTS_MANAGE);
  const mainBranch = await getMainBranch();
  const nombre = formData.get("nombre") as string;
  const tipo = formData.get("tipo") as string;
  const categoriaIdStr = formData.get("categoriaId") as string;
  const umbralMinimo = parseFloat(formData.get("umbralMinimo") as string);
  const porcentajeDescuento = parseFloat(formData.get("porcentajeDescuento") as string);
  const optionalId = (key: string) => { const value = Number(formData.get(key)); return Number.isInteger(value) && value > 0 ? value : null; };
  const optionalDate = (key: string) => { const value = String(formData.get(key) ?? ""); return value ? new Date(value) : null; };

  if (!nombre || !tipo) return { error: "Nombre y tipo son requeridos." };
  if (isNaN(umbralMinimo) || isNaN(porcentajeDescuento)) return { error: "Umbral y porcentaje deben ser numéricos." };
  if (porcentajeDescuento <= 0 || porcentajeDescuento > 100) return { error: "El porcentaje debe estar entre 1 y 100." };

  try {
    const regla = await prisma.reglaDescuento.create({
      data: {
        sucursalId: mainBranch.id,
        nombre,
        tipo,
        categoriaId: categoriaIdStr ? parseInt(categoriaIdStr) : null,
        familiaId: optionalId("familiaId"), marcaId: optionalId("marcaId"), productoId: optionalId("productoId"), varianteId: optionalId("varianteId"), clienteId: optionalId("clienteId"),
        vigenteDesde: optionalDate("vigenteDesde"), vigenteHasta: optionalDate("vigenteHasta"),
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
  varianteId?: number | null;
  familiaId?: number | null;
  marcaId?: number | null;
  cantidad: number; // en m2 o unidades
  precioUnitario: number;
  subtotal: number;
}

export async function calcularDescuentoAutomatico(items: CartItemForDiscount[], clienteId?: number | null) {
  await requireAuthenticatedUser();
  const mainBranch = await getMainBranch();
  const reglas = await prisma.reglaDescuento.findMany({
    where: { activa: true, sucursalId: mainBranch.id },
  });

  if (reglas.length === 0 || items.length === 0) {
    return { porcentaje: 0, monto: 0, reglaAplicada: null, reglaAplicadaId: null };
  }
  const result = evaluateBestPromotion({ items, rules: reglas, clientId: clienteId });
  return { porcentaje: result.percentage, monto: result.amount, reglaAplicada: result.ruleName, reglaAplicadaId: result.ruleId };
}
