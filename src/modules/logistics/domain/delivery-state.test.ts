import { describe, expect, it } from "vitest";
import { DELIVERY_STATES, validateDeliveryTransition } from "./delivery-state";

describe("delivery workflow", () => {
  it("defines every operational state", () => expect(DELIVERY_STATES).toEqual(["PENDIENTE", "EN_PREPARACION", "LISTO_DESPACHO", "EN_CAMINO", "ENTREGADO", "ENTREGA_FALLIDA", "CANCELADO"]));
  it("accepts the normal delivery path", () => { expect(() => validateDeliveryTransition("PENDIENTE", "EN_PREPARACION")).not.toThrow(); expect(() => validateDeliveryTransition("EN_PREPARACION", "LISTO_DESPACHO")).not.toThrow(); expect(() => validateDeliveryTransition("LISTO_DESPACHO", "EN_CAMINO")).not.toThrow(); expect(() => validateDeliveryTransition("EN_CAMINO", "ENTREGADO")).not.toThrow(); });
  it("rejects invalid jumps", () => expect(() => validateDeliveryTransition("PENDIENTE", "ENTREGADO")).toThrow("inválida"));
});
