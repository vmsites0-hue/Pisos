import { describe, expect, it } from "vitest";
import { evaluateBestPromotion } from "./promotion-engine";

const items = [{ productoId: 1, varianteId: 2, categoriaId: 3, familiaId: 4, marcaId: 5, cantidad: 10, subtotal: 1000 }];

describe("promotion engine", () => {
  it("chooses the greatest monetary benefit", () => expect(evaluateBestPromotion({ items, rules: [{ id: 1, nombre: "A", porcentajeDescuento: 5, umbralMinimo: 1 }, { id: 2, nombre: "B", porcentajeDescuento: 10, umbralMinimo: 1 }] }).ruleId).toBe(2));
  it("honors product hierarchy, client and validity period", () => expect(evaluateBestPromotion({ items, clientId: 9, now: new Date("2026-06-01"), rules: [{ id: 3, nombre: "Segmentada", porcentajeDescuento: 12, umbralMinimo: 1, familiaId: 4, categoriaId: 3, marcaId: 5, productoId: 1, varianteId: 2, clienteId: 9, vigenteDesde: new Date("2026-01-01"), vigenteHasta: new Date("2026-12-31") }] }).amount).toBe(120));
  it("ignores expired or mismatched rules", () => expect(evaluateBestPromotion({ items, clientId: 1, now: new Date("2026-06-01"), rules: [{ id: 3, nombre: "No aplica", porcentajeDescuento: 50, umbralMinimo: 1, clienteId: 2 }] }).amount).toBe(0));
});
