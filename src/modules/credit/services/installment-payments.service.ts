import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { applyInstallmentPayment } from "@/modules/credit/domain/installment-payment";
import { recordAudit } from "@/modules/audit/services/audit.service";

const PAYMENT_METHODS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"];
export async function registerInstallmentPayment(input: { installmentId: number; amount: number; paymentMethod: string }) {
  const actor = await requirePermission(PERMISSIONS.PAYMENTS_CREATE);
  if (!PAYMENT_METHODS.includes(input.paymentMethod)) return { error: "El método de cobro no es válido." };
  try {
    const payment = await prisma.$transaction(async (tx) => {
      const installment = await tx.cuotaCredito.findUniqueOrThrow({ where: { id: input.installmentId }, include: { creditoVenta: { include: { venta: { include: { cliente: true } }, cuotas: true } } } });
      const applied = applyInstallmentPayment({ amountDue: installment.monto, alreadyPaid: installment.pagado, payment: input.amount, dueDate: installment.venceEn });
      const created = await tx.pagoCuota.create({ data: { cuotaId: installment.id, usuarioId: actor.id, monto: input.amount, metodoPago: input.paymentMethod } });
      await tx.cuotaCredito.update({ where: { id: installment.id }, data: { pagado: applied.paid, estado: applied.state } });
      const creditBalance = Math.max(0, installment.creditoVenta.saldoPendiente - input.amount);
      await tx.creditoVenta.update({ where: { id: installment.creditoVenta.id }, data: { saldoPendiente: creditBalance, estado: creditBalance <= 0.000001 ? "PAGADO" : "ACTIVO" } });
      await tx.cliente.update({ where: { id: installment.creditoVenta.venta.clienteId }, data: { saldoDeudor: Math.max(0, installment.creditoVenta.venta.cliente.saldoDeudor - input.amount) } });
      await recordAudit({ userId: actor.id, action: "COBRO_CUOTA_REGISTRADO", entity: "PagoCuota", entityId: created.id, after: { cuotaId: installment.id, monto: input.amount, metodoPago: input.paymentMethod, estadoCuota: applied.state } }, tx);
      return created;
    });
    revalidatePath("/finanzas"); revalidatePath("/clientes"); return { success: true, payment };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo registrar el cobro." }; }
}
