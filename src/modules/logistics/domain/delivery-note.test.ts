import { describe, expect, it } from "vitest";
import { buildDeliveryNote } from "./delivery-note";
describe("delivery note", () => {
  it("contains customer, assignments, goods and non-fiscal marker", () => expect(buildDeliveryNote({ saleId: 7, delivery: { clienteNombre: "Ana", clienteTelefono: "123", direccion: "Calle 1", observaciones: "Portón azul", encargado: { nombre: "Eva" }, chofer: { nombre: "Leo" } }, lines: [{ name: "Piso", quantity: 10.4, unit: "M2" }] })).toMatchObject({ number: "NE-7", customer: "Ana", manager: "Eva", driver: "Leo", fiscal: false }));
  it("rejects an empty note", () => expect(() => buildDeliveryNote({ saleId: 1, delivery: { clienteNombre: "A", clienteTelefono: null, direccion: null, observaciones: null }, lines: [] })).toThrow("mercadería"));
});
