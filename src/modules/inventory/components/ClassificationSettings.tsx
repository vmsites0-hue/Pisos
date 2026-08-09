import type { getClassifications } from "@/modules/inventory/services/classifications.service";
import {
  createClassificationAction,
  removeClassificationAction,
  updateClassificationAction,
} from "@/modules/inventory/actions/classifications.actions";

type Data = Awaited<ReturnType<typeof getClassifications>>;

export function ClassificationSettings({ families, categories, brands }: Data) {
  const groups = [
    { kind: "FAMILIA", title: "Familias", items: families },
    { kind: "CATEGORIA", title: "Categorías", items: categories },
    { kind: "MARCA", title: "Marcas", items: brands },
  ] as const;

  return (
    <section className="space-y-4 rounded-xl border bg-white p-6">
      <div><h2 className="text-lg font-bold">Clasificación del catálogo</h2><p className="text-sm text-slate-500">Las clasificaciones utilizadas se desactivan en lugar de eliminarse.</p></div>
      <div className="grid gap-5 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.kind} className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">{group.title}</h3>
            <form action={createClassificationAction} className="space-y-2">
              <input type="hidden" name="kind" value={group.kind} />
              <input name="name" required placeholder={`Nueva ${group.title.toLowerCase().slice(0, -1)}`} className="w-full rounded border px-3 py-2" />
              {group.kind === "CATEGORIA" && <select name="familyId" required className="w-full rounded border px-3 py-2"><option value="">Familia…</option>{families.filter((family) => family.activa).map((family) => <option key={family.id} value={family.id}>{family.nombre}</option>)}</select>}
              <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Crear</button>
            </form>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.id} className="rounded border p-3">
                  <form action={updateClassificationAction} className="space-y-2">
                    <input type="hidden" name="kind" value={group.kind} /><input type="hidden" name="id" value={item.id} />
                    <input name="name" defaultValue={item.nombre} required className="w-full rounded border px-2 py-1.5 text-sm" />
                    {group.kind === "CATEGORIA" && <select name="familyId" defaultValue={("familiaId" in item && item.familiaId) || ""} className="w-full rounded border px-2 py-1.5 text-sm">{families.map((family) => <option key={family.id} value={family.id}>{family.nombre}</option>)}</select>}
                    <label className="block text-sm"><input type="checkbox" name="active" defaultChecked={item.activa} /> Activa</label>
                    <button className="rounded border px-2 py-1 text-sm">Guardar</button>
                  </form>
                  <form action={removeClassificationAction} className="mt-2">
                    <input type="hidden" name="kind" value={group.kind} /><input type="hidden" name="id" value={item.id} />
                    <button className="text-xs text-red-600">Eliminar o desactivar</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
