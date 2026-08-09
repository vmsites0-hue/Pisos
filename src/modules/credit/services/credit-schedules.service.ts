import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { buildAmortizationSchedule } from "@/modules/credit/domain/amortization";

export async function simulateCredit(input: { planId: number; principal: number; firstDueDate?: string | null }) {
  await requireAuthenticatedUser();
  const plan = await prisma.planCredito.findFirst({ where: { id: input.planId, activo: true } });
  if (!plan) return { error: "El plan de crédito no existe o está inactivo." };
  const firstDueDate = input.firstDueDate ? new Date(input.firstDueDate) : new Date(Date.now() + plan.diasPrimeraCuota * 86400000);
  try { return { success: true, plan: { id: plan.id, nombre: plan.nombre, sistema: plan.sistema }, ...buildAmortizationSchedule({ principal: input.principal, annualRate: plan.tasaAnual, installments: plan.numeroCuotas, system: plan.sistema as "FRANCES" | "ALEMAN", periodicityMonths: plan.periodicidadMeses, firstDueDate, precision: plan.precisionMonetaria }) }; }
  catch (error) { return { error: error instanceof Error ? error.message : "No se pudo simular el crédito." }; }
}
