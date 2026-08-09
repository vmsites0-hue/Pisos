export const SALE_POLICIES = ["SOLO_CAJAS_COMPLETAS", "CANTIDAD_EXACTA", "CAJAS_Y_FRACCION", "UNIDADES_ENTERAS", "MULTIPLO_CONFIGURABLE"] as const;
export type SalePolicy = (typeof SALE_POLICIES)[number];

export function validateUnit(input: { codigo: string; nombre: string; simbolo: string; precision: number; admiteDecimales: boolean }) {
  if (!/^[A-Z0-9_]+$/.test(input.codigo)) throw new Error("El código de unidad solo admite mayúsculas, números y guion bajo.");
  if (!input.nombre.trim() || !input.simbolo.trim()) throw new Error("Nombre y símbolo son obligatorios.");
  if (!Number.isInteger(input.precision) || input.precision < 0 || input.precision > 6) throw new Error("La precisión debe ser un entero entre 0 y 6.");
  if (!input.admiteDecimales && input.precision !== 0) throw new Error("Una unidad entera debe tener precisión 0.");
}

export function validatePresentation(input: { factorConversion: number; piezas?: number | null }) {
  if (!Number.isFinite(input.factorConversion) || input.factorConversion <= 0) throw new Error("El factor de conversión debe ser mayor que cero.");
  if (input.piezas != null && (!Number.isInteger(input.piezas) || input.piezas <= 0)) throw new Error("Las piezas deben ser un entero positivo.");
}
