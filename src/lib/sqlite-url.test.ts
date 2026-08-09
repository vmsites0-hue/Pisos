import { describe, expect, it } from "vitest";
import { resolveSqliteUrl } from "./sqlite-url";

describe("resolveSqliteUrl", () => {
  it("normalizes relative SQLite paths against the project directory", () => {
    expect(resolveSqliteUrl("file:./dev.db", "C:/workspace/pisos")).toBe("file:C:/workspace/pisos/dev.db");
  });

  it("preserves absolute SQLite and remote database URLs", () => {
    expect(resolveSqliteUrl("file:C:/data/prod.db", "C:/workspace")).toBe("file:C:/data/prod.db");
    expect(resolveSqliteUrl("postgresql://db/app", "C:/workspace")).toBe("postgresql://db/app");
  });
});
