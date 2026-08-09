export const CREDIT_SYSTEMS = ["FRANCES", "ALEMAN"] as const;

export function validateCreditPlan(input: { system: string; annualRate: number; installments: number; periodicityMonths: number; firstDueDays: number; precision: number }) {
  if (!CREDIT_SYSTEMS.includes(input.system as (typeof CREDIT_SYSTEMS)[number])) throw new Error("El sistema de crédito debe ser francés o alemán.");
  if (!Number.isFinite(input.annualRate) || input.annualRate < 0) throw new Error("La tasa debe ser válida.");
  if (!Number.isInteger(input.installments) || input.installments < 1 || input.installments > 360) throw new Error("La cantidad de cuotas es inválida.");
  if (!Number.isInteger(input.periodicityMonths) || input.periodicityMonths < 1) throw new Error("La periodicidad debe ser mensual.");
  if (!Number.isInteger(input.firstDueDays) || input.firstDueDays < 0) throw new Error("La primera fecha es inválida.");
  if (!Number.isInteger(input.precision) || input.precision < 0 || input.precision > 4) throw new Error("La precisión monetaria es inválida.");
}

export function roundMoney(value: number, precision: number) { return Number(value.toFixed(precision)); }
