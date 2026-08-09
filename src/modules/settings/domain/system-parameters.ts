export type ParameterType = "STRING" | "NUMBER" | "BOOLEAN";

export interface ParameterDefinition {
  key: string;
  type: ParameterType;
  defaultValue: string;
  description: string;
  validation: { min?: number; max?: number; integer?: boolean; options?: string[] };
}

export const SYSTEM_PARAMETERS: ParameterDefinition[] = [
  { key: "MONEDA", type: "STRING", defaultValue: "PYG", description: "Moneda usada en precios y totales", validation: { options: ["PYG", "USD"] } },
  { key: "PRECISION_DECIMALES", type: "NUMBER", defaultValue: "2", description: "Cantidad de decimales para cantidades", validation: { min: 0, max: 4, integer: true } },
  { key: "IMPUESTO_PORCENTAJE", type: "NUMBER", defaultValue: "10", description: "Porcentaje impositivo informativo", validation: { min: 0, max: 100 } },
  { key: "PRESUPUESTO_VALIDEZ_DIAS", type: "NUMBER", defaultValue: "15", description: "Vigencia predeterminada de presupuestos", validation: { min: 0, max: 365, integer: true } },
  { key: "REDONDEO_MODO", type: "STRING", defaultValue: "NEAREST", description: "Modo general de redondeo", validation: { options: ["NEAREST", "UP", "DOWN"] } },
];

export function validateParameterValue(definition: ParameterDefinition, value: string) {
  if (definition.type === "BOOLEAN") return value === "true" || value === "false";
  if (definition.type === "STRING") return !definition.validation.options || definition.validation.options.includes(value);

  const number = Number(value);
  if (!Number.isFinite(number)) return false;
  if (definition.validation.integer && !Number.isInteger(number)) return false;
  if (definition.validation.min !== undefined && number < definition.validation.min) return false;
  if (definition.validation.max !== undefined && number > definition.validation.max) return false;
  return true;
}

export function parameterDefinition(key: string) {
  return SYSTEM_PARAMETERS.find((item) => item.key === key);
}

export function buildParameterSnapshot(parameters: Array<{ clave: string; valor: string }>) {
  return Object.fromEntries(parameters.map((item) => [item.clave, item.valor]));
}
