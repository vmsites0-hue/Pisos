import { describe, expect, it } from "vitest";
import { validateSaleContract } from "./sale-validation";

const valid = { clienteId: 1, metodoPago: "EFECTIVO", tipoEntrega: "ENVIO", detalles: [{ productoId: 1, cantidad: 2.08, precioUnitario: 100 }] };
describe("sale contract", () => {
  it("accepts a complete sale with or without client", () => {
    expect(() => validateSaleContract(valid)).not.toThrow();
    expect(() => validateSaleContract({ ...valid, clienteId: null })).not.toThrow();
    expect(() => validateSaleContract({ ...valid, clienteId: 0 })).not.toThrow();
  });
  it("requires registered client only for credit payment", () => {
    expect(() => validateSaleContract({ ...valid, metodoPago: "CREDITO", clienteId: 0 })).toThrow("crédito");
    expect(() => validateSaleContract({ ...valid, metodoPago: "CREDITO", clienteId: null })).toThrow("crédito");
    expect(() => validateSaleContract({ ...valid, metodoPago: "CREDITO", clienteId: 2 })).not.toThrow();
  });
  it("rejects invalid payment and delivery values", () => { expect(() => validateSaleContract({ ...valid, metodoPago: "OTRO" })).toThrow("pago"); expect(() => validateSaleContract({ ...valid, tipoEntrega: "OTRO" })).toThrow("entrega"); });
  it("rejects invalid line values", () => expect(() => validateSaleContract({ ...valid, detalles: [{ productoId: 1, cantidad: 0, precioUnitario: 1 }] })).toThrow("líneas"));
});

