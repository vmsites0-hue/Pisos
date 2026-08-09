import { describe, expect, it } from "vitest";
import { compareCommercialValues } from "./variation";
const base = { price: 100, presentation: "Caja", factor: 2.08, available: true, discount: 10 };
describe("quotation variation comparison", () => {
  it("returns no warning without variations", () => expect(compareCommercialValues({ previous: base, current: { ...base } })).toEqual([]));
  it("reports price, presentation, conversion, availability and discount", () => expect(compareCommercialValues({ previous: base, current: { price: 110, presentation: "Pallet", factor: 20.8, available: false, discount: 5 } }).map((item) => item.field)).toEqual(["PRECIO", "PRESENTACION", "CONVERSION", "DISPONIBILIDAD", "DESCUENTO"]));
});
