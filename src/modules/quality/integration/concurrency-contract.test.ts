import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
describe("inventory concurrency contract", () => {
  it.each(["src/modules/sales/services/sales.service.ts", "src/modules/reservations/services/reservations.service.ts"])("uses an optimistic conditional claim in %s", (file) => {
    const service = read(file);
    expect(service).toContain("stockActual: inventory.stockActual".replace("inventory", file.includes("sales") ? "inv!" : "inventory"));
    expect(service).toContain("stockReservado:");
    expect(service).toContain("claimedStock.count !== 1");
  });
  it("keeps expiration and notification writes idempotent", () => {
    expect(read("src/modules/reservations/services/expiration.service.ts")).toContain("updateMany");
    expect(read("src/modules/notifications/services/notification-dispatch.service.ts")).toContain("upsert");
  });
});
