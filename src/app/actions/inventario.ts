"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function ajustarStock(formData: FormData) {
  try {
    const productoId = parseInt(formData.get("productoId") as string);
    const sucursalId = parseInt(formData.get("sucursalId") as string);
    const loteTono = (formData.get("loteTono") as string)?.trim() || null;
    const cantidad = parseFloat(formData.get("cantidad") as string);
    const tipoAjuste = formData.get("tipoAjuste") as string; // "SUMAR", "RESTAR", "FIJAR"

    if (isNaN(productoId) || isNaN(sucursalId) || isNaN(cantidad)) {
      return { error: "Faltan datos obligatorios o son inválidos." };
    }

    // Buscar si ya existe un registro de inventario para este producto, sucursal y lote/tono
    const inventarioExistente = await prisma.inventario.findFirst({
      where: {
        productoId,
        sucursalId,
        loteTono: loteTono || null,
      },
    });

    let nuevoStock = cantidad;

    if (inventarioExistente) {
      if (tipoAjuste === "SUMAR") {
        nuevoStock = inventarioExistente.stockActual + cantidad;
      } else if (tipoAjuste === "RESTAR") {
        nuevoStock = inventarioExistente.stockActual - cantidad;
      } else if (tipoAjuste === "FIJAR") {
        nuevoStock = cantidad;
      }

      if (nuevoStock < 0) {
        return { error: `El stock resultante (${nuevoStock}) no puede ser menor a 0.` };
      }

      await prisma.inventario.update({
        where: { id: inventarioExistente.id },
        data: { stockActual: nuevoStock },
      });
    } else {
      if (tipoAjuste === "RESTAR") {
        return { error: "No se puede restar stock de un inventario inexistente." };
      }

      if (nuevoStock < 0) {
        return { error: "El stock inicial no puede ser menor a 0." };
      }

      await prisma.inventario.create({
        data: {
          productoId,
          sucursalId,
          loteTono: loteTono || null,
          stockActual: nuevoStock,
          stockReservado: 0,
        },
      });
    }

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al ajustar el inventario." };
  }
}
