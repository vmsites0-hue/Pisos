import { describe, expect, it } from "vitest";
import { buildDeliverySnapshot } from "./delivery";

const customer = { nombre: "Ana", apellido: "Pérez", telefono: "123", direccion: "Calle 1" };
describe("sale delivery", () => {
  it("creates a pending immutable customer snapshot for shipping", () => expect(buildDeliverySnapshot({ deliveryType: "ENVIO", customer })).toEqual({ estado: "PENDIENTE", clienteNombre: "Ana Pérez", clienteTelefono: "123", direccion: "Calle 1" }));
  it("does not create home delivery for pickup", () => expect(buildDeliverySnapshot({ deliveryType: "RETIRO", customer })).toBeNull());
});
