import { describe, expect, it } from "vitest";
import { classificationRemovalPolicy } from "./classification-policy";

describe("classification removal policy", () => {
  it("deletes unused classifications", () => {
    expect(classificationRemovalPolicy(0)).toBe("DELETE");
  });

  it("deactivates classifications referenced by products", () => {
    expect(classificationRemovalPolicy(1)).toBe("DEACTIVATE");
    expect(classificationRemovalPolicy(50)).toBe("DEACTIVATE");
  });

  it("rejects invalid usage counts", () => {
    expect(() => classificationRemovalPolicy(-1)).toThrow();
    expect(() => classificationRemovalPolicy(1.5)).toThrow();
  });
});
