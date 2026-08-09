import { describe, expect, it } from "vitest";
import { validatePresentation, validateUnit } from "./unit";

describe("configurable units", () => {
  it("accepts decimal and integer unit definitions", () => {
    expect(() => validateUnit({ codigo: "M2", nombre: "Metro cuadrado", simbolo: "m²", precision: 2, admiteDecimales: true })).not.toThrow();
    expect(() => validateUnit({ codigo: "CAJA", nombre: "Caja", simbolo: "cj", precision: 0, admiteDecimales: false })).not.toThrow();
  });
  it("rejects inconsistent precision and invalid presentations", () => {
    expect(() => validateUnit({ codigo: "CAJA", nombre: "Caja", simbolo: "cj", precision: 2, admiteDecimales: false })).toThrow("precisión 0");
    expect(() => validatePresentation({ factorConversion: 0 })).toThrow("mayor que cero");
    expect(() => validatePresentation({ factorConversion: 2.08, piezas: 0 })).toThrow("entero positivo");
  });
});
