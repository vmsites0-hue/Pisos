import { describe, expect, it } from "vitest";
import { adjustmentDelta, resultingStock, STOCK_MOVEMENT_TYPES } from "./stock-movement";

describe("inventory movements", () => {
  it("covers every required movement kind", () => expect(STOCK_MOVEMENT_TYPES).toEqual(["INGRESO", "VENTA", "RESERVA", "LIBERACION", "AJUSTE", "DEVOLUCION", "PERDIDA", "CANCELACION_VENTA"]));
  it("calculates adjustment deltas", () => {
    expect(adjustmentDelta(10, 3, "SUMAR")).toBe(3); expect(adjustmentDelta(10, 3, "RESTAR")).toBe(-3); expect(adjustmentDelta(10, 3, "FIJAR")).toBe(-7);
  });
  it("never permits negative resulting stock", () => expect(() => resultingStock(2, -3)).toThrow("no puede quedar negativo"));
});
