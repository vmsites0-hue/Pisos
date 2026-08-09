import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "./permissions";

describe("permission catalog", () => {
  it("uses unique, stable machine-readable codes", () => {
    const codes = Object.values(PERMISSIONS);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[a-z]+(?:\.[a-z]+)+$/);
  });

  it("contains the critical approval and audit permissions", () => {
    expect(PERMISSIONS.APPROVALS_REVIEW).toBe("approvals.review");
    expect(PERMISSIONS.AUDIT_VIEW).toBe("audit.view");
  });
});
