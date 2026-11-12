import Link from "next/link";

export default function OfflinePage() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">Sin conexión</h1><p className="mt-3 text-slate-600">Distri Pisos necesita conexión para ventas, reservas, inventario, cobros y logística. Reconectate y volvé a intentar.</p><Link href="/" className="mt-6 inline-block rounded bg-slate-900 px-4 py-2 text-sm text-white">Reintentar</Link></section></main>;
}
