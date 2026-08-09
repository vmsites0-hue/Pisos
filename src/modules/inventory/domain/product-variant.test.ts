import { describe, expect, it } from "vitest";
import { validateVariantValues } from "./product-variant";

describe("variant attribute values", () => {
  it("requires configured identity data", () => {
    const errors = validateVariantValues([{ id: 1, tipo: "TEXTO", obligatorio: true, opciones: null }], new Map());
    expect(errors).toContain("El atributo 1 es obligatorio.");
  });

  it("validates number, boolean and selection types", () => {
    const definitions = [
      { id: 1, tipo: "NUMERO", obligatorio: false, opciones: null },
      { id: 2, tipo: "BOOLEANO", obligatorio: false, opciones: null },
      { id: 3, tipo: "SELECCION", obligatorio: false, opciones: '["Mate","Brillante"]' },
    ];
    expect(validateVariantValues(definitions, new Map([[1, "60"], [2, "true"], [3, "Mate"]]))).toEqual([]);
    expect(validateVariantValues(definitions, new Map([[1, "x"], [2, "sí"], [3, "Rústico"]]))).toHaveLength(3);
  });
});
