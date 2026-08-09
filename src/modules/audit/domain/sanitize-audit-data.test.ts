import { describe, expect, it } from "vitest";
import { sanitizeAuditData } from "./sanitize-audit-data";

describe("sanitizeAuditData", () => {
  it("redacts sensitive values recursively", () => {
    expect(sanitizeAuditData({ email: "a@b.com", password: "plain", nested: { token: "abc" } })).toEqual({
      email: "a@b.com",
      password: "[REDACTED]",
      nested: { token: "[REDACTED]" },
    });
  });

  it("normalizes dates and bigint values", () => {
    expect(sanitizeAuditData({ at: new Date("2026-08-09T00:00:00.000Z"), amount: BigInt(10) })).toEqual({
      at: "2026-08-09T00:00:00.000Z",
      amount: "10",
    });
  });
});
