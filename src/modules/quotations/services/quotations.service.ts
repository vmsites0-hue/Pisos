import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { getSystemParameterSnapshot } from "@/modules/settings/services/system-parameters.service";
import { calculateProductQuantity } from "@/modules/inventory/domain/quantity-conversion";

export interface DetallePresupuestoInput {
  productoId: number;
  varianteId?: number | null;
  cantidad: number;
  precioUnitario: number;
}

export interface PresupuestoInput {
  clienteId: number;
  descuento: number;
  detalles: DetallePresupuestoInput[];
}

export async function crearPresupuesto(input: PresupuestoInput) {
  await requirePermission(PERMISSIONS.QUOTATIONS_MANAGE);
  const mainBranch = await getMainBranch();
  const configurationSnapshot = await getSystemParameterSnapshot();
  try {
    const { clienteId, descuento, detalles } = input;

    if (!clienteId || detalles.length === 0) {
      return { error: "Faltan datos obligatorios para crear el presupuesto." };
    }

    // 1. Validar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });
    if (!cliente) {
      return { error: "El cliente seleccionado no existe." };
    }

    let subtotal = 0;
    const detallesToCreate = [];

    // 2. Procesar ítems
    for (const item of detalles) {
      const producto = await prisma.producto.findUnique({
        where: { id: item.productoId },
        include: { variantes: { where: { activa: true, ...(item.varianteId ? { id: item.varianteId } : {}) }, orderBy: { id: "asc" }, include: { unidadBase: true, presentaciones: { where: { activa: true }, include: { unidad: true } } } } },
      });
      if (!producto) {
        return { error: `El producto con ID ${item.productoId} no existe.` };
      }
      const variant = producto.variantes[0];
      if (!variant) return { error: `El producto "${producto.nombre}" no tiene una variante activa.` };

      const conversion = calculateProductQuantity(producto, item.cantidad);
      const itemSubtotal = conversion.actualQuantity * item.precioUnitario;
      subtotal += itemSubtotal;

      detallesToCreate.push({
        productoId: item.productoId,
        varianteId: variant.id,
        cantidad: conversion.actualQuantity,
        cantidadSolicitada: conversion.requestedQuantity,
        cantidadPresentacion: conversion.presentationQuantity,
        conversionSnapshot: JSON.stringify(conversion),
        precioUnitario: item.precioUnitario,
        subtotal: itemSubtotal,
      });
    }

    const total = subtotal - descuento;
    if (total < 0) {
      return { error: "El total del presupuesto no puede ser menor a 0." };
    }

    // 3. Crear el Presupuesto y Detalles
    const presupuesto = await prisma.presupuesto.create({
      data: {
        sucursalId: mainBranch.id,
        clienteId,
        subtotal,
        descuento,
        total,
        validezDias: Number(configurationSnapshot.PRESUPUESTO_VALIDEZ_DIAS ?? 15),
        configuracionSnapshot: JSON.stringify(configurationSnapshot),
        detalles: {
          create: detallesToCreate,
        },
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
        cliente: true,
      },
    });

    revalidatePath("/presupuestos");
    return { success: true, presupuesto };
  } catch (error: any) {
    return { error: error.message || "Error al crear el presupuesto." };
  }
}

export async function eliminarPresupuesto(id: number) {
  await requirePermission(PERMISSIONS.QUOTATIONS_MANAGE);
  try {
    await prisma.presupuesto.delete({
      where: { id },
    });

    revalidatePath("/presupuestos");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el presupuesto." };
  }
}
