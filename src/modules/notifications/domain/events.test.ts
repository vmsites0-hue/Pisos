import { describe, expect, it } from "vitest";
import { NOTIFICATION_EVENTS, notificationKey } from "./events";
describe("notification events", () => {
  it("covers the ten MVP business events", () => expect(NOTIFICATION_EVENTS).toHaveLength(10));
  it("builds stable recipient-scoped idempotency keys", () => expect(notificationKey("PEDIDO_LISTO", 12, 4)).toBe(notificationKey("PEDIDO_LISTO", 12, 4)));
});
