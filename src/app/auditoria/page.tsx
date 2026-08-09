import { getAuditRecords } from "@/modules/audit/repositories/audit.repository";

export default async function AuditoriaPage() {
  const records = await getAuditRecords();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-sm text-slate-500">Registro de solo lectura de operaciones sensibles.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50"><tr><th className="p-3">Fecha</th><th className="p-3">Usuario</th><th className="p-3">Acción</th><th className="p-3">Entidad</th><th className="p-3">Datos</th></tr></thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b align-top">
                <td className="whitespace-nowrap p-3">{record.creadoEn.toLocaleString("es-PY")}</td>
                <td className="p-3">{record.usuario?.nombre ?? "Sistema"}</td>
                <td className="p-3 font-medium">{record.accion}</td>
                <td className="p-3">{record.entidad}{record.entidadId ? ` #${record.entidadId}` : ""}</td>
                <td className="max-w-md p-3"><pre className="overflow-auto whitespace-pre-wrap text-xs">{record.datosDespues ?? record.datosAntes ?? "—"}</pre></td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay eventos registrados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
