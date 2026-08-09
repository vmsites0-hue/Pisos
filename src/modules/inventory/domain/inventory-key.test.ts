import { describe, expect, it } from "vitest";
import { inventoryDimensionsEqual, normalizeInventoryDimension } from "./inventory-key";

describe("variant inventory dimensions", () => {
  it("normalizes physical dimensions", () => expect(normalizeInventoryDimension(" tono-a ")).toBe("TONO-A"));
  it("does not mix tone or calibre combinations", () => {
    expect(inventoryDimensionsEqual({ lote: "L1", tono: "A", calibre: "4" }, { lote: "L1", tono: "B", calibre: "4" })).toBe(false);
    expect(inventoryDimensionsEqual({ lote: "L1", tono: "A", calibre: "4" }, { lote: "L1", tono: "A", calibre: "4" })).toBe(true);
  });
});
