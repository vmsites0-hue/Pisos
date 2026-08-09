import { describe, expect, it } from "vitest";
import { validateSaleContract } from "./sale-validation";

const valid = { clienteId: 1, metodoPago: "EFECTIVO", tipoEntrega: "ENVIO", detalles: [{ productoId: 1, cantidad: 2.08, precioUnitario: 100 }] };
describe("sale contract", () => {
  it("accepts a complete sale", () => expect(() => validateSaleContract(valid)).not.toThrow());
  it("rejects invalid payment and delivery values", () => { expect(() => validateSaleContract({ ...valid, metodoPago: "OTRO" })).toThrow("pago"); expect(() => validateSaleContract({ ...valid, tipoEntrega: "OTRO" })).toThrow("entrega"); });
  it("rejects invalid line values", () => expect(() => validateSaleContract({ ...valid, detalles: [{ productoId: 1, cantidad: 0, precioUnitario: 1 }] })).toThrow("líneas"));
});
