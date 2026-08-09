"use client";
import { useState } from "react";
import { convertReservationToSaleAction, releaseReservationAction } from "@/modules/reservations/actions/reservations.actions";

export function ReservationActions({ reservation }: { reservation: any }) {
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (!["ACTIVA", "PARCIALMENTE_CONSUMIDA"].includes(reservation.estado)) return null;
  async function convert(formData: FormData) { setBusy(true); setError(null); const result = await convertReservationToSaleAction(formData); setBusy(false); if (result.error) setError(result.error); }
  async function release(formData: FormData) { setBusy(true); setError(null); const result = await releaseReservationAction(formData); setBusy(false); if (result.error) setError(result.error); }
  return <details className="relative inline-block"><summary className="cursor-pointer rounded border px-2 py-1 text-xs">Reserva #{reservation.id}</summary><div className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded border bg-white p-3 text-left shadow-xl">{error && <p className="rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    <form action={convert} className="space-y-2"><input type="hidden" name="reservationId" value={reservation.id} /><strong className="text-xs">Convertir líneas reservadas en venta</strong><div className="grid grid-cols-2 gap-2"><select name="paymentMethod" className="rounded border p-1 text-xs"><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option><option value="CREDITO">Crédito</option></select><select name="deliveryType" className="rounded border p-1 text-xs"><option value="ENVIO">Envío</option><option value="RETIRO">Retiro</option></select></div><button disabled={busy} className="w-full rounded bg-slate-900 p-1 text-xs text-white">Confirmar venta</button></form>
    <form action={release} className="space-y-2 border-t pt-2"><input type="hidden" name="reservationId" value={reservation.id} /><input required name="reason" placeholder="Motivo de liberación" className="w-full rounded border p-1 text-xs" /><button disabled={busy} className="w-full rounded border p-1 text-xs text-red-700">Liberar reserva</button></form>
  </div></details>;
}
