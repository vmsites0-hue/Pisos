import { describe, expect, it } from "vitest";
import { availableStock, matchesCatalogQuery } from "./catalog-search";

const item = { producto: { codigo: "P-1", codigoBarras: "789", nombre: "Porcelanato", marca: null, marcaCatalogo: { nombre: "Delta" } }, variante: { sku: "SKU-20", codigoBarras: "456", valores: [{ valor: "60x60" }] }, loteTono: "L1-A", lote: "L1", tono: "A" };

describe("sales catalog", () => {
  it.each(["P-1", "789", "porcelanato", "delta", "SKU-20", "456", "60x60", "L1-A"])("finds by %s", (query) => expect(matchesCatalogQuery(item, query)).toBe(true));
  it("calculates net available stock", () => expect(availableStock(12, 4.5)).toBe(7.5));
});
