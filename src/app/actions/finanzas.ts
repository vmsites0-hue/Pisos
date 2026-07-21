"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function registrarPagoCliente(clienteId: number, monto: number) {
  try {
    if (isNaN(clienteId) || isNaN(monto) || monto <= 0) {
      return { error: "Monto o ID de cliente inválido." };
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return { error: "El cliente seleccionado no existe." };
    }

    const nuevoSaldo = Math.max(0, cliente.saldoDeudor - monto);

    await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        saldoDeudor: nuevoSaldo,
      },
    });

    revalidatePath("/finanzas");
    revalidatePath("/clientes");
    revalidatePath("/ventas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al registrar el pago del cliente." };
  }
}
