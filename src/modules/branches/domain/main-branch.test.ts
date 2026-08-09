import { describe, expect, it } from "vitest";
import { assertSingleMainBranch } from "./main-branch";

describe("assertSingleMainBranch", () => {
  it("returns the only active main branch", () => {
    const main = { id: 1, activa: true, esPrincipal: true };
    expect(assertSingleMainBranch([main, { id: 2, activa: false, esPrincipal: false }])).toBe(main);
  });

  it("rejects missing or ambiguous main branches", () => {
    expect(() => assertSingleMainBranch([])).toThrow("exactamente un local principal");
    expect(() => assertSingleMainBranch([
      { id: 1, activa: true, esPrincipal: true },
      { id: 2, activa: true, esPrincipal: true },
    ])).toThrow("se encontraron 2");
  });
});
