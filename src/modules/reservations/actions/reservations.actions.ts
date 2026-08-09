"use server";
import { createManualReservation } from "@/modules/reservations/services/reservations.service";
import { convertReservationToSale, releaseReservation } from "@/modules/reservations/services/reservations.service";

export async function createManualReservationAction(formData: FormData) {
  const quotationId = Number(formData.get("quotationId"));
  const lines = [...formData.entries()].filter(([key]) => key.startsWith("line_")).map(([key, value]) => ({ quotationLineId: Number(key.slice(5)), quantity: Number(value) }));
  const expirationMode = String(formData.get("expirationMode") ?? "NONE") as "NONE" | "DEFAULT" | "CUSTOM";
  try { await createManualReservation({ quotationId, lines, expirationMode, customExpiration: String(formData.get("customExpiration") ?? "") || null }); return { success: true }; }
  catch (error: unknown) { return { error: error instanceof Error ? error.message : "No se pudo crear la reserva." }; }
}

export async function releaseReservationAction(formData: FormData) {
  try { await releaseReservation(Number(formData.get("reservationId")), String(formData.get("reason") ?? "")); return { success: true }; }
  catch (error: unknown) { return { error: error instanceof Error ? error.message : "No se pudo liberar la reserva." }; }
}

export async function convertReservationToSaleAction(formData: FormData) {
  return convertReservationToSale({ reservationId: Number(formData.get("reservationId")), paymentMethod: String(formData.get("paymentMethod") ?? "EFECTIVO"), deliveryType: String(formData.get("deliveryType") ?? "ENVIO"), variationDecision: String(formData.get("variationDecision") ?? "AUTO") as "AUTO" | "PRESERVE" | "RECALCULATE" | "CANCEL" });
}
