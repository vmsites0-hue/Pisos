export type SummarySale = { subtotal: number; descuento: number; total: number };
export type SummaryMovement = { tipo: string; categoria: string; importe: number; afectaCaja: boolean };

export function summarizeFinances(sales: SummarySale[], movements: SummaryMovement[], accountsReceivable: number) {
  const grossSales = sales.reduce((sum, sale) => sum + sale.subtotal, 0);
  const discounts = sales.reduce((sum, sale) => sum + sale.descuento, 0);
  const returns = movements.filter((item) => item.categoria === "DEVOLUCION").reduce((sum, item) => sum + item.importe, 0);
  const cancellations = movements.filter((item) => item.categoria === "CANCELACION_VENTA").reduce((sum, item) => sum + item.importe, 0);
  const expenses = movements.filter((item) => item.categoria === "GASTO").reduce((sum, item) => sum + item.importe, 0)
    - movements.filter((item) => item.categoria === "ANULACION_GASTO").reduce((sum, item) => sum + item.importe, 0);
  const collections = movements.filter((item) => item.afectaCaja && item.tipo === "INGRESO" && item.categoria !== "ANULACION_GASTO").reduce((sum, item) => sum + item.importe, 0);
  const cashBalance = movements.filter((item) => item.afectaCaja).reduce((sum, item) => sum + (item.tipo === "INGRESO" ? item.importe : -item.importe), 0);
  return { grossSales, discounts, returns, netSales: grossSales - discounts - returns - cancellations, collections, accountsReceivable, expenses, cashBalance };
}
