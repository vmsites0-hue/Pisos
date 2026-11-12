import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/services/access.service";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function registrarDeudaCliente(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.PAYMENTS_CREATE);
  try {
    const clienteId = Number(formData.get("clienteId"));
    const monto = Number(formData.get("monto"));
    const concepto = String(formData.get("concepto") ?? "").trim();
    const notas = String(formData.get("notas") ?? "").trim() || null;
    const fechaDeudaRaw = String(formData.get("fechaDeuda") ?? "");
    const vencimientoRaw = String(formData.get("fechaVencimiento") ?? "");
    const fechaDeuda = fechaDeudaRaw ? new Date(`${fechaDeudaRaw}T12:00:00`) : new Date();
    const fechaVencimiento = vencimientoRaw ? new Date(`${vencimientoRaw}T12:00:00`) : null;

    if (!Number.isInteger(clienteId) || clienteId <= 0) throw new Error("Seleccioná un cliente.");
    if (!Number.isFinite(monto) || monto <= 0) throw new Error("El monto debe ser mayor a cero.");
    if (!concepto) throw new Error("Indicá qué debe el cliente (concepto).");
    if (Number.isNaN(fechaDeuda.getTime()) || (fechaVencimiento && Number.isNaN(fechaVencimiento.getTime()))) throw new Error("Las fechas son inválidas.");

    const debt = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
      if (!cliente) throw new Error("El cliente seleccionado no existe.");
      const created = await tx.deudaCliente.create({ data: { clienteId, concepto, montoOriginal: monto, saldo: monto, fechaDeuda, fechaVencimiento, notas, usuarioId: user.id } });
      await tx.cliente.update({ where: { id: clienteId }, data: { saldoDeudor: { increment: monto } } });
      await recordAudit({ userId: user.id, action: "DEUDA_CLIENTE_REGISTRADA", entity: "DeudaCliente", entityId: created.id, after: created }, tx);
      return created;
    });

    revalidatePath("/finanzas");
    revalidatePath("/clientes");
    return { success: true, id: debt.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo registrar la deuda." };
  }
}
