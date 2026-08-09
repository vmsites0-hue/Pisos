import { describe, expect, it } from "vitest";
import { summarizeFinances } from "./financial-summary";

describe("financial summary", () => {
  it("separates commercial results from period cash flow", () => {
    const result = summarizeFinances(
      [{ subtotal: 110, descuento: 10, total: 100 }],
      [
        { tipo: "INGRESO", categoria: "VENTA_DEVENGADA", importe: 100, afectaCaja: false },
        { tipo: "INGRESO", categoria: "COBRO_CREDITO", importe: 40, afectaCaja: true },
        { tipo: "EGRESO", categoria: "GASTO", importe: 15, afectaCaja: true },
      ],
      60,
    );
    expect(result).toEqual({ grossSales: 110, discounts: 10, returns: 0, netSales: 100, collections: 40, accountsReceivable: 60, expenses: 15, cashBalance: 25 });
  });
});
