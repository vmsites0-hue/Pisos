import { describe, expect, it } from "vitest";
import { APPROVAL_TYPES, isApprovalType } from "./approval-types";

describe("approval types", () => {
  it("recognizes every supported restricted operation", () => {
    expect(Object.values(APPROVAL_TYPES)).toHaveLength(7);
    for (const type of Object.values(APPROVAL_TYPES)) expect(isApprovalType(type)).toBe(true);
  });

  it("rejects arbitrary operation names", () => {
    expect(isApprovalType("BORRAR_AUDITORIA")).toBe(false);
  });
});
