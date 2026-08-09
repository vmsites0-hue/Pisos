import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
describe("server security and atomicity boundaries", () => {
  it.each([
    "src/modules/sales/services/sales.service.ts",
    "src/modules/reservations/services/reservations.service.ts",
    "src/modules/returns/services/sale-cancellations.service.ts",
    "src/modules/returns/services/returns.service.ts",
    "src/modules/logistics/services/logistics.service.ts",
    "src/modules/credit/services/installment-payments.service.ts",
  ])("keeps %s authorization on the server", (file) => expect(source(file)).toMatch(/requirePermission\(/));
  it.each(["src/modules/sales/services/sales.service.ts", "src/modules/reservations/services/reservations.service.ts"])("keeps %s stock changes transactional", (file) => expect(source(file)).toContain("prisma.$transaction"));
  it("consumes approval exactly once inside a transaction", () => {
    const approvals = source("src/modules/approvals/services/approvals.service.ts");
    expect(approvals).toContain("ejecutadoEn: null"); expect(approvals).toContain("prisma.$transaction");
  });
});
