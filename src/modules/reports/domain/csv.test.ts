import { describe, expect, it } from "vitest";
import { isReportDataset, toCsv } from "./csv";
describe("report exports", () => {
  it("escapes commas, quotes and preserves UTF-8 for spreadsheet clients", () => expect(toCsv(["Descripción"], [['Piso 60x60, "mate"']])).toBe('\uFEFF"Descripción"\r\n"Piso 60x60, ""mate"""'));
  it("only accepts the five MVP datasets", () => { expect(isReportDataset("entregas")).toBe(true); expect(isReportDataset("usuarios")).toBe(false); });
});
