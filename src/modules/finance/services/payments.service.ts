import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordFinancialMovement } from "@/modules/finance/services/financial-movements.service";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function registrarPagoCliente(clienteId: number, monto: number, metodoPago = "EFECTIVO") {
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

    const updated = await prisma.$transaction(async (tx) => {
      // El cobro cancela primero las deudas manuales más antiguas.
      let restante = monto;
      const deudas = await tx.deudaCliente.findMany({ where: { clienteId, estado: "PENDIENTE" }, orderBy: { fechaDeuda: "asc" } });
      for (const deuda of deudas) {
        if (restante <= 0) break;
        const aplicado = Math.min(deuda.saldo, restante);
        restante -= aplicado;
        const saldo = deuda.saldo - aplicado;
        await tx.deudaCliente.update({ where: { id: deuda.id }, data: { saldo, estado: saldo <= 0 ? "PAGADA" : "PENDIENTE" } });
      }
      // El dinero cobrado ingresa a caja (si es en efectivo) y queda como movimiento financiero.
      await recordFinancialMovement(tx, { type: "INGRESO", category: "COBRO_CLIENTE", amount: monto, affectsResult: false, affectsCash: metodoPago === "EFECTIVO", paymentMethod: metodoPago, userId: user.id, referenceType: "Cliente", referenceId: clienteId, description: `Cobro de deuda a ${cliente.nombre} ${cliente.apellido}` });
      return tx.cliente.update({ where: { id: clienteId }, data: { saldoDeudor: nuevoSaldo } });
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
