import type { SalePolicy } from "./unit";
import { SALE_POLICIES } from "./unit";

export type QuantityConversion = {
  requestedQuantity: number;
  actualQuantity: number;
  presentationQuantity: number;
  completePresentations: number;
  remainder: number;
};

function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateSaleQuantity(input: { requestedQuantity: number; conversionFactor?: number; policy: SalePolicy; precision: number; multiple?: number | null }): QuantityConversion {
  const { requestedQuantity, policy } = input;
  const conversionFactor = input.conversionFactor ?? 1;
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) throw new Error("La cantidad solicitada debe ser mayor que cero.");
  if (!Number.isFinite(conversionFactor) || conversionFactor <= 0) throw new Error("El factor de conversión debe ser mayor que cero.");
  if (!Number.isInteger(input.precision) || input.precision < 0 || input.precision > 6) throw new Error("La precisión configurada es inválida.");

  let actualQuantity = requestedQuantity;
  let presentationQuantity = requestedQuantity / conversionFactor;
  if (policy === "SOLO_CAJAS_COMPLETAS") {
    presentationQuantity = Math.ceil(presentationQuantity - Number.EPSILON);
    actualQuantity = presentationQuantity * conversionFactor;
  } else if (policy === "UNIDADES_ENTERAS") {
    actualQuantity = Math.ceil(requestedQuantity - Number.EPSILON);
    presentationQuantity = actualQuantity / conversionFactor;
  } else if (policy === "MULTIPLO_CONFIGURABLE") {
    const multiple = input.multiple ?? 0;
    if (!Number.isFinite(multiple) || multiple <= 0) throw new Error("El múltiplo configurado debe ser mayor que cero.");
    actualQuantity = Math.ceil(requestedQuantity / multiple - Number.EPSILON) * multiple;
    presentationQuantity = actualQuantity / conversionFactor;
  }

  actualQuantity = round(actualQuantity, input.precision);
  presentationQuantity = round(presentationQuantity, input.precision);
  const completePresentations = Math.floor(actualQuantity / conversionFactor + Number.EPSILON);
  const remainder = round(actualQuantity - completePresentations * conversionFactor, input.precision);
  return { requestedQuantity: round(requestedQuantity, input.precision), actualQuantity, presentationQuantity, completePresentations, remainder };
}

export function calculateProductQuantity(product: {
  unidadVenta: string; m2PorCaja: number | null; variantes: Array<{ politicaVenta: string; multiploVenta: number | null; unidadBase: { precision: number } | null; presentaciones: Array<{ nombre: string; factorConversion: number; predeterminada: boolean; unidad: { codigo: string; simbolo: string } }> }>;
}, requestedQuantity: number) {
  const variant = product.variantes[0];
  const presentation = variant?.presentaciones.find((item) => item.unidad.codigo === "CAJA" && !item.predeterminada)
    ?? variant?.presentaciones.find((item) => !item.predeterminada);
  const configuredPolicy = variant?.politicaVenta;
  const policy: SalePolicy = SALE_POLICIES.includes(configuredPolicy as SalePolicy)
    ? configuredPolicy as SalePolicy
    : product.m2PorCaja ? "SOLO_CAJAS_COMPLETAS" : "UNIDADES_ENTERAS";
  const factor = presentation?.factorConversion ?? product.m2PorCaja ?? 1;
  const precision = variant?.unidadBase?.precision ?? 2;
  const conversion = calculateSaleQuantity({ requestedQuantity, conversionFactor: factor, policy, precision, multiple: variant?.multiploVenta });
  return { ...conversion, policy, conversionFactor: factor, presentationName: presentation?.nombre ?? product.unidadVenta, presentationSymbol: presentation?.unidad.simbolo ?? product.unidadVenta };
}
