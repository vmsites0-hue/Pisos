"use server";
import { createManualReservation } from "@/modules/reservations/services/reservations.service";

export async function createManualReservationAction(formData: FormData) {
  const quotationId = Number(formData.get("quotationId"));
  const lines = [...formData.entries()].filter(([key]) => key.startsWith("line_")).map(([key, value]) => ({ quotationLineId: Number(key.slice(5)), quantity: Number(value) }));
  const expirationMode = String(formData.get("expirationMode") ?? "NONE") as "NONE" | "DEFAULT" | "CUSTOM";
  try { await createManualReservation({ quotationId, lines, expirationMode, customExpiration: String(formData.get("customExpiration") ?? "") || null }); return { success: true }; }
  catch (error: unknown) { return { error: error instanceof Error ? error.message : "No se pudo crear la reserva." }; }
}
