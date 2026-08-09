import { describe, expect, it } from "vitest";
import { markNotificationRead } from "./notification";

describe("notification inbox", () => {
  it("marks only the notification as read and preserves an existing timestamp", () => {
    const first = new Date("2026-01-01T00:00:00Z");
    expect(markNotificationRead({ readAt: first }, new Date()).readAt).toBe(first);
  });
});
