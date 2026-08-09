"use client";
import { useState } from "react";
import { createManualReservationAction } from "@/modules/reservations/actions/reservations.actions";

export function ManualReservationForm({ quotation }: { quotation: any }) {
  const [open, setOpen] = useState(false); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [expirationMode, setExpirationMode] = useState("NONE");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    const result = await createManualReservationAction(new FormData(event.currentTarget)); setLoading(false);
    if (result.error) setError(result.error); else setOpen(false);
  }
  return <div className="inline-block text-left">
    <button onClick={() => setOpen(!open)} className="rounded border bg-white px-2 py-1 text-xs font-semibold text-blue-700">Reservar</button>
    {open && <div className="absolute right-8 z-20 mt-2 w-96 rounded-lg border bg-white p-4 text-left shadow-xl">
      <h4 className="mb-2 font-bold">Reserva manual — #PRES-{quotation.id}</h4>
      {error && <p className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <form onSubmit={submit} className="space-y-3"><input type="hidden" name="quotationId" value={quotation.id} />
        {quotation.detalles.map((line: any) => { const reserved = line.lineasReserva.reduce((sum: number, item: any) => sum + item.cantidad, 0); const remaining = Math.max(0, line.cantidad - reserved); return <label key={line.id} className="grid grid-cols-[1fr_100px] items-center gap-2 text-xs"><span><strong>{line.variante?.sku ?? line.producto.codigo}</strong> — pendiente {remaining} {line.producto.unidadVenta}</span><input name={`line_${line.id}`} type="number" min="0" max={remaining} step="0.001" defaultValue="0" disabled={remaining <= 0} className="rounded border p-1.5" /></label>; })}
        <label className="block text-xs font-medium">Vencimiento<select name="expirationMode" value={expirationMode} onChange={(event) => setExpirationMode(event.target.value)} className="mt-1 w-full rounded border p-1.5"><option value="NONE">Sin vencimiento</option><option value="DEFAULT">Duración predeterminada</option><option value="CUSTOM">Fecha específica</option></select></label>
        {expirationMode === "CUSTOM" && <input required name="customExpiration" type="datetime-local" className="w-full rounded border p-1.5 text-xs" />}
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded border px-2 py-1">Cancelar</button><button disabled={loading} className="rounded bg-slate-900 px-2 py-1 text-white">{loading ? "Reservando…" : "Confirmar"}</button></div>
      </form>
    </div>}
  </div>;
}
