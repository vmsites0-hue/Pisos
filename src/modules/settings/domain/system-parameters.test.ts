import { describe, expect, it } from "vitest";
import { buildParameterSnapshot, parameterDefinition, SYSTEM_PARAMETERS, validateParameterValue } from "./system-parameters";

describe("system parameters", () => {
  it("defines required parameters with valid defaults and descriptions", () => {
    expect(SYSTEM_PARAMETERS.map((item) => item.key)).toEqual([
      "MONEDA", "PRECISION_DECIMALES", "IMPUESTO_PORCENTAJE", "PRESUPUESTO_VALIDEZ_DIAS", "REDONDEO_MODO", "APROBACION_AJUSTE_NEGATIVO", "RESERVA_DURACION_DIAS", "DESCUENTO_MANUAL_LIMITE_PORCENTAJE",
    ]);
    for (const item of SYSTEM_PARAMETERS) {
      expect(item.description).not.toBe("");
      expect(validateParameterValue(item, item.defaultValue)).toBe(true);
    }
  });

  it("rejects values outside their validation rules", () => {
    expect(validateParameterValue(parameterDefinition("PRECISION_DECIMALES")!, "2.5")).toBe(false);
    expect(validateParameterValue(parameterDefinition("IMPUESTO_PORCENTAJE")!, "101")).toBe(false);
    expect(validateParameterValue(parameterDefinition("REDONDEO_MODO")!, "RANDOM")).toBe(false);
  });

  it("builds an independent historical snapshot", () => {
    const parameters = [{ clave: "MONEDA", valor: "PYG" }];
    const snapshot = buildParameterSnapshot(parameters);
    parameters[0].valor = "USD";
    expect(snapshot).toEqual({ MONEDA: "PYG" });
  });
});
