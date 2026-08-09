import { describe, expect, it } from "vitest";
import { parseProductImageUrls } from "./product-image";

describe("product images", () => {
  it("deduplicates, orders and selects the first image as primary", () => {
    expect(parseProductImageUrls("https://cdn.test/a.jpg\nhttps://cdn.test/b.jpg\nhttps://cdn.test/a.jpg")).toEqual([
      { url: "https://cdn.test/a.jpg", orden: 0, principal: true },
      { url: "https://cdn.test/b.jpg", orden: 1, principal: false },
    ]);
  });

  it("rejects invalid and unsafe protocols", () => {
    expect(() => parseProductImageUrls("archivo.jpg")).toThrow("no es una URL válida");
    expect(() => parseProductImageUrls("file:///tmp/a.jpg")).toThrow("HTTP o HTTPS");
  });
});
