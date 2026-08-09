import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { validateCreditPlan } from "@/modules/credit/domain/credit-plan";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function getCreditPlans() { return prisma.planCredito.findMany({ orderBy: { creadoEn: "desc" } }); }

export async function createCreditPlan(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const input = { name: String(formData.get("name") ?? "").trim(), system: String(formData.get("system") ?? ""), annualRate: Number(formData.get("annualRate")), installments: Number(formData.get("installments")), periodicityMonths: Number(formData.get("periodicityMonths") ?? 1), firstDueDays: Number(formData.get("firstDueDays") ?? 30), precision: Number(formData.get("precision") ?? 0) };
  if (!input.name) return { error: "El nombre del plan es obligatorio." };
  try {
    validateCreditPlan(input);
    const plan = await prisma.planCredito.create({ data: { nombre: input.name, sistema: input.system, tasaAnual: input.annualRate, numeroCuotas: input.installments, periodicidadMeses: input.periodicityMonths, diasPrimeraCuota: input.firstDueDays, precisionMonetaria: input.precision, politicaAjuste: String(formData.get("adjustmentPolicy") ?? "CUOTA_FIJA"), politicaMora: String(formData.get("latePolicy") ?? "SIN_MORA"), politicaPagoAnticipado: String(formData.get("prepaymentPolicy") ?? "REDUCIR_PLAZO"), tasaVariable: formData.get("variableRate") === "on", politicaRecalculo: String(formData.get("recalculationPolicy") ?? "AUTORIZADO"), moneda: String(formData.get("currency") ?? "PYG") } });
    await recordAudit({ userId: actor.id, action: "PLAN_CREDITO_CREADO", entity: "PlanCredito", entityId: plan.id, after: plan }); revalidatePath("/configuracion"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "No se pudo crear el plan." }; }
}
