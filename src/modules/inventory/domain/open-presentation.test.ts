import { describe, expect, it } from "vitest";
import { packagingEvents, physicalPackaging } from "./open-presentation";

describe("open presentations", () => {
  it("separates closed boxes and remainder for fractionable stock", () => expect(physicalPackaging({ stock: 10, factor: 2.08, fractionable: true, precision: 2 })).toEqual({ closedPresentations: 4, openRemainder: 1.68 }));
  it("rejects remainder for non-fractionable variants", () => expect(() => physicalPackaging({ stock: 10, factor: 2.08, fractionable: false, precision: 2 })).toThrow("presentaciones completas"));
  it("registers opening and consumption", () => expect(packagingEvents({ stock: 10.4, closed: 5, remainder: 0 }, { stock: 9, closed: 4, remainder: 0.68 })).toEqual([{ type: "APERTURA", quantity: 1 }, { type: "CONSUMO", quantity: 1.4 }]));
});
