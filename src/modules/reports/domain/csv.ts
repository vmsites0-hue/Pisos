export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const cell = (value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return `\uFEFF${[headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")}`;
}

export const REPORT_DATASETS = ["inventario", "ventas", "gastos", "cuentas-por-cobrar", "entregas"] as const;
export function isReportDataset(value: string): value is (typeof REPORT_DATASETS)[number] {
  return REPORT_DATASETS.includes(value as (typeof REPORT_DATASETS)[number]);
}
