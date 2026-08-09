import { describe, expect, it } from "vitest";
import { validateSaleCancellation } from "./sale-cancellation";

describe("sale cancellation", () => {
  it("allows a pending sale with reason", () => expect(() => validateSaleCancellation({ estado: "PENDIENTE", alreadyCancelled: false, reason: "Carga duplicada" })).not.toThrow());
  it("rejects delivered sales and points to returns", () => expect(() => validateSaleCancellation({ estado: "ENTREGADO", alreadyCancelled: false, reason: "Error" })).toThrow("devolución"));
  it("rejects repeated cancellation", () => expect(() => validateSaleCancellation({ estado: "CANCELADA", alreadyCancelled: true, reason: "Error" })).toThrow("ya fue"));
});
