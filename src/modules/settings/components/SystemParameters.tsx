import type { getSystemParameters } from "@/modules/settings/services/system-parameters.service";
import { updateSystemParameterAction } from "@/modules/settings/actions/system-parameters.actions";

type Parameter = Awaited<ReturnType<typeof getSystemParameters>>[number];

export function SystemParameters({ parameters }: { parameters: Parameter[] }) {
  return (
    <section className="space-y-4 rounded-xl border bg-white p-6">
      <div><h2 className="text-lg font-bold">Parámetros generales</h2><p className="text-sm text-slate-500">Valores tipados usados en nuevas operaciones.</p></div>
      <div className="grid gap-3 lg:grid-cols-2">
        {parameters.map((parameter) => (
          <form key={parameter.clave} action={updateSystemParameterAction} className="rounded-lg border p-4">
            <input type="hidden" name="key" value={parameter.clave} />
            <label className="font-medium" htmlFor={`parameter-${parameter.clave}`}>{parameter.clave}</label>
            <p className="mb-2 text-xs text-slate-500">{parameter.descripcion} · Tipo {parameter.tipo} · Predeterminado {parameter.valorPredeterminado}</p>
            <div className="flex gap-2">
              <input id={`parameter-${parameter.clave}`} name="value" defaultValue={parameter.valor} required className="min-w-0 flex-1 rounded border px-3 py-2" />
              <button className="rounded bg-slate-900 px-3 py-2 text-white">Guardar</button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}
