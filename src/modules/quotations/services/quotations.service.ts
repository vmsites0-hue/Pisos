import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface DetallePresupuestoInput {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface PresupuestoInput {
  clienteId: number;
  descuento: number;
  detalles: DetallePresupuestoInput[];
}

export async function crearPresupuesto(input: PresupuestoInput) {
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
      });
      if (!producto) {
        return { error: `El producto con ID ${item.productoId} no existe.` };
      }

      const itemSubtotal = item.cantidad * item.precioUnitario;
      subtotal += itemSubtotal;

      detallesToCreate.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
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
        clienteId,
        subtotal,
        descuento,
        total,
        validezDias: 15, // Por defecto 15 días de validez
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
