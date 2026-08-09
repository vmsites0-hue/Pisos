import { describe, expect, it } from "vitest";
import { validateDeliveryFailure } from "./delivery-failure";
describe("failed delivery", () => {
  it("requires a reason while in transit", () => expect(() => validateDeliveryFailure({ state: "EN_CAMINO", reason: "Cliente ausente" })).not.toThrow());
  it("rejects an empty reason", () => expect(() => validateDeliveryFailure({ state: "EN_CAMINO", reason: " " })).toThrow("motivo"));
  it("rejects failure outside transit", () => expect(() => validateDeliveryFailure({ state: "PENDIENTE", reason: "Error" })).toThrow("en camino"));
});
