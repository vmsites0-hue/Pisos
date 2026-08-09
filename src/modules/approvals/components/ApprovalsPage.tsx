import {
  approveRequestAction,
  rejectRequestAction,
  requestApprovalAction,
  updateSelfApprovalPolicyAction,
} from "@/modules/approvals/actions/approvals.actions";
import { APPROVAL_TYPE_LABELS } from "@/modules/approvals/domain/approval-types";
import type { getApprovalsPageData } from "@/modules/approvals/repositories/approvals.repository";

type PageData = Awaited<ReturnType<typeof getApprovalsPageData>> & {
  canManagePolicy: boolean;
};

export function ApprovalsPage({ requests, policy, currentUserId, canReview, canManagePolicy }: PageData) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aprobaciones</h1>
        <p className="text-sm text-slate-500">Las autorizaciones aprobadas habilitan una sola ejecución.</p>
      </div>

      <form action={requestApprovalAction} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-2">
        <h2 className="font-semibold md:col-span-2">Nueva solicitud</h2>
        <select name="type" required className="rounded border px-3 py-2">
          {Object.entries(APPROVAL_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input name="reason" required placeholder="Motivo de la solicitud" className="rounded border px-3 py-2" />
        <input name="entity" placeholder="Entidad, por ejemplo Venta" className="rounded border px-3 py-2" />
        <input name="entityId" placeholder="Identificador relacionado" className="rounded border px-3 py-2" />
        <textarea name="proposedValues" defaultValue="{}" required className="min-h-24 rounded border px-3 py-2 font-mono text-sm md:col-span-2" />
        <button className="rounded bg-slate-900 px-4 py-2 text-white md:w-fit">Solicitar aprobación</button>
      </form>

      {canManagePolicy && (
        <form action={updateSelfApprovalPolicyAction} className="flex items-center gap-3 rounded-xl border bg-white p-4">
          <input type="hidden" name="enabled" value={policy?.permitirAutoAprobacion ? "false" : "true"} />
          <span className="text-sm">Autoaprobación: <strong>{policy?.permitirAutoAprobacion ? "permitida" : "bloqueada"}</strong></span>
          <button className="rounded border px-3 py-1.5 text-sm">Cambiar política</button>
        </form>
      )}

      <div className="space-y-3">
        {requests.length === 0 && <p className="rounded-xl border bg-white p-6 text-center text-slate-500">No hay solicitudes.</p>}
        {requests.map((request) => {
          const label = APPROVAL_TYPE_LABELS[request.tipo as keyof typeof APPROVAL_TYPE_LABELS] ?? request.tipo;
          const canResolve = canReview && request.estado === "PENDIENTE" && (policy?.permitirAutoAprobacion || request.solicitanteId !== currentUserId);
          return (
            <article key={request.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">#{request.id} · {label}</h2>
                  <p className="text-sm text-slate-500">Solicitó {request.solicitante.nombre} · {request.solicitadoEn.toLocaleString("es-PY")}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{request.estado}</span>
              </div>
              <p className="mt-3 text-sm"><strong>Motivo:</strong> {request.motivo}</p>
              <pre className="mt-2 overflow-auto rounded bg-slate-50 p-3 text-xs">{request.valoresPropuestos}</pre>
              {request.aprobador && <p className="mt-2 text-xs text-slate-500">Resolvió: {request.aprobador.nombre}</p>}
              {canResolve && (
                <div className="mt-4 flex gap-2">
                  <form action={approveRequestAction}><input type="hidden" name="requestId" value={request.id} /><button className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white">Aprobar</button></form>
                  <form action={rejectRequestAction}><input type="hidden" name="requestId" value={request.id} /><button className="rounded bg-red-600 px-3 py-1.5 text-sm text-white">Rechazar</button></form>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
