import { describe, expect, it } from "vitest";
import { shouldDeactivateSubscription, validatePushSubscription } from "./push-subscription";

describe("push subscriptions", () => {
  it("requires browser endpoint and keys", () => expect(validatePushSubscription({ endpoint: "https://push.test/a", p256dh: "key", auth: "secret" }).endpoint).toContain("push.test"));
  it("deactivates expired subscriptions without treating transient failures as invalid", () => {
    expect(shouldDeactivateSubscription(410)).toBe(true);
    expect(shouldDeactivateSubscription(503)).toBe(false);
  });
});
