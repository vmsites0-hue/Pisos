import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { isReportDataset } from "@/modules/reports/domain/csv";
import { exportReport } from "@/modules/reports/services/reports.service";

export async function GET(request: NextRequest, context: { params: Promise<{ dataset: string }> }) {
  await requireAuthenticatedUser();
  const { dataset } = await context.params;
  if (!isReportDataset(dataset)) return new Response("Reporte desconocido", { status: 404 });
  const query = request.nextUrl.searchParams;
  const csv = await exportReport(dataset, { from: query.get("from") ? new Date(`${query.get("from")}T00:00:00`) : undefined, to: query.get("to") ? new Date(`${query.get("to")}T23:59:59.999`) : undefined, userId: query.get("userId") ? Number(query.get("userId")) : undefined, paymentMethod: query.get("paymentMethod") || undefined });
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${dataset}.csv"`, "Cache-Control": "no-store" } });
}
