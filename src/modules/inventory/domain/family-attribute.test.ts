import { describe, expect, it } from "vitest";
import { normalizeAttributeKey, validateAttributeDefinition } from "./family-attribute";

describe("family attributes", () => {
  it("normalizes stable keys", () => {
    expect(normalizeAttributeKey("  Espesor (mm) ")).toBe("ESPESOR_MM");
    expect(normalizeAttributeKey("Tono / calibre")).toBe("TONO_CALIBRE");
  });

  it("validates supported types and selection options", () => {
    expect(validateAttributeDefinition("TEXTO", [])).toBe(true);
    expect(validateAttributeDefinition("SELECCION", ["Mate", "Brillante"])).toBe(true);
    expect(validateAttributeDefinition("SELECCION", [])).toBe(false);
    expect(validateAttributeDefinition("FECHA", [])).toBe(false);
  });
});
