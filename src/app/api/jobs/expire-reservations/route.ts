import { NextRequest, NextResponse } from "next/server";
import { expireDueReservations } from "@/modules/reservations/services/expiration.service";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await expireDueReservations());
}
