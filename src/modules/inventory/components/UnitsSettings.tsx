import type { getUnits } from "@/modules/inventory/services/units.service";
import { deactivateUnitAction, saveUnitAction } from "@/modules/inventory/actions/units.actions";
type Unit = Awaited<ReturnType<typeof getUnits>>[number];

export function UnitsSettings({ units }: { units: Unit[] }) {
  return <section className="space-y-4 rounded-xl border bg-white p-6">
    <div><h2 className="text-lg font-bold">Unidades de medida</h2><p className="text-sm text-slate-500">Configura símbolos, precisión y uso de cantidades decimales.</p></div>
    <form action={saveUnitAction} className="grid gap-2 md:grid-cols-6">
      <input name="code" required placeholder="Código" className="rounded border px-3 py-2 uppercase" />
      <input name="name" required placeholder="Nombre" className="rounded border px-3 py-2" />
      <input name="symbol" required placeholder="Símbolo" className="rounded border px-3 py-2" />
      <input name="precision" required type="number" min="0" max="6" defaultValue="0" className="rounded border px-3 py-2" />
      <label className="flex items-center gap-2 text-sm"><input name="decimals" type="checkbox" /> Admite decimales</label>
      <button className="rounded bg-slate-900 px-3 py-2 text-white">Crear unidad</button>
    </form>
    <div className="grid gap-2 lg:grid-cols-2">{units.map((unit) => <div key={unit.id} className="rounded border p-3">
      <form action={saveUnitAction} className="grid grid-cols-2 gap-2 text-sm">
        <input type="hidden" name="id" value={unit.id} /><input name="code" defaultValue={unit.codigo} className="rounded border px-2 py-1.5 uppercase" /><input name="name" defaultValue={unit.nombre} className="rounded border px-2 py-1.5" />
        <input name="symbol" defaultValue={unit.simbolo} className="rounded border px-2 py-1.5" /><input name="precision" type="number" min="0" max="6" defaultValue={unit.precision} className="rounded border px-2 py-1.5" />
        <div className="col-span-2 flex gap-4"><label><input name="decimals" type="checkbox" defaultChecked={unit.admiteDecimales} /> Decimales</label><label><input name="active" type="checkbox" defaultChecked={unit.activa} /> Activa</label></div>
        <button className="rounded border px-2 py-1.5">Guardar</button>
      </form>
      {unit.activa && <form action={deactivateUnitAction} className="mt-2"><input type="hidden" name="id" value={unit.id} /><button className="text-sm text-red-600">Desactivar</button></form>}
    </div>)}</div>
  </section>;
}
