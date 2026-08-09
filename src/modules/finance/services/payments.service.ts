import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function registrarPagoCliente(clienteId: number, monto: number) {
  const user = await requirePermission(PERMISSIONS.PAYMENTS_CREATE);
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

    const updated = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        saldoDeudor: nuevoSaldo,
      },
    });
    await recordAudit({ userId: user.id, action: "COBRO_REGISTRADO", entity: "Cliente", entityId: clienteId, before: cliente, after: updated });

    revalidatePath("/finanzas");
    revalidatePath("/clientes");
    revalidatePath("/ventas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al registrar el pago del cliente." };
  }
}
