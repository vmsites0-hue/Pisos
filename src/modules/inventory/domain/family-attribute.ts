export const ATTRIBUTE_TYPES = ["TEXTO", "NUMERO", "SELECCION", "BOOLEANO"] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export function normalizeAttributeKey(value: string) {
  return value.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function validateAttributeDefinition(type: string, options: string[]) {
  if (!ATTRIBUTE_TYPES.includes(type as AttributeType)) return false;
  if (type === "SELECCION") return options.filter((item) => item.trim()).length >= 1;
  return options.filter((item) => item.trim()).length === 0;
}
