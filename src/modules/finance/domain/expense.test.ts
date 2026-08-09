import { describe, expect, it } from "vitest";
import { cancelExpense } from "./expense";

describe("controlled expenses", () => {
  it("preserves the confirmed expense by producing a cancellation state", () => {
    expect(cancelExpense("CONFIRMADO", "Carga duplicada")).toEqual({ state: "ANULADO", reason: "Carga duplicada" });
  });

  it("rejects repeated cancellation and missing reasons", () => {
    expect(() => cancelExpense("ANULADO", "otra vez")).toThrow("ya fue anulado");
    expect(() => cancelExpense("CONFIRMADO", " ")).toThrow("obligatorio");
  });
});
