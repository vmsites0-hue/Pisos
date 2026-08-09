export function applyInstallmentPayment(input: { amountDue: number; alreadyPaid: number; payment: number; dueDate: Date; now?: Date }) {
  if (!Number.isFinite(input.payment) || input.payment <= 0) throw new Error("El cobro debe ser positivo.");
  const remaining = Math.max(0, input.amountDue - input.alreadyPaid);
  if (input.payment > remaining + 0.000001) throw new Error("El cobro supera el saldo de la cuota.");
  const paid = input.alreadyPaid + input.payment;
  const state = paid >= input.amountDue - 0.000001 ? "PAGADA" : paid > 0 ? "PAGO_PARCIAL" : input.dueDate < (input.now ?? new Date()) ? "VENCIDA" : "PENDIENTE";
  return { paid, remaining: Math.max(0, input.amountDue - paid), state };
}

export function installmentDisplayState(input: { amountDue: number; paid: number; dueDate: Date; now?: Date }) {
  if (input.paid >= input.amountDue - 0.000001) return "PAGADA";
  if (input.paid > 0) return "PAGO_PARCIAL";
  return input.dueDate < (input.now ?? new Date()) ? "VENCIDA" : "PENDIENTE";
}
