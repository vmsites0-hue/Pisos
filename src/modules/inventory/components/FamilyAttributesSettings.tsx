import type { getFamilyAttributes } from "@/modules/inventory/services/family-attributes.service";
import type { getClassifications } from "@/modules/inventory/services/classifications.service";
import { deactivateFamilyAttributeAction, saveFamilyAttributeAction } from "@/modules/inventory/actions/family-attributes.actions";

type Attribute = Awaited<ReturnType<typeof getFamilyAttributes>>[number];
type Family = Awaited<ReturnType<typeof getClassifications>>["families"][number];

export function FamilyAttributesSettings({ attributes, families }: { attributes: Attribute[]; families: Family[] }) {
  return (
    <section className="space-y-4 rounded-xl border bg-white p-6">
      <div><h2 className="text-lg font-bold">Atributos por familia</h2><p className="text-sm text-slate-500">Texto, número, selección o booleano; pueden ser obligatorios, filtrables y parte de la identidad.</p></div>
      <form action={saveFamilyAttributeAction} className="grid gap-2 md:grid-cols-4">
        <select name="familyId" required className="rounded border px-3 py-2"><option value="">Familia…</option>{families.filter((item) => item.activa).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
        <input name="name" required placeholder="Nombre del atributo" className="rounded border px-3 py-2" />
        <select name="type" className="rounded border px-3 py-2"><option value="TEXTO">Texto</option><option value="NUMERO">Número</option><option value="SELECCION">Selección</option><option value="BOOLEANO">Booleano</option></select>
        <input name="options" placeholder="Opciones separadas por coma" className="rounded border px-3 py-2" />
        <label className="text-sm"><input name="required" type="checkbox" /> Obligatorio</label>
        <label className="text-sm"><input name="filterable" type="checkbox" /> Filtrable</label>
        <label className="text-sm"><input name="identity" type="checkbox" /> Identidad de variante</label>
        <button className="rounded bg-slate-900 px-3 py-2 text-white">Crear atributo</button>
      </form>
      <div className="grid gap-2 lg:grid-cols-2">
        {attributes.map((attribute) => (
          <div key={attribute.id} className="rounded border p-3 text-sm">
            <form action={saveFamilyAttributeAction} className="grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="id" value={attribute.id} />
              <select name="familyId" defaultValue={attribute.familiaId} className="rounded border px-2 py-1.5">{families.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
              <input name="name" defaultValue={attribute.nombre} className="rounded border px-2 py-1.5" />
              <select name="type" defaultValue={attribute.tipo} className="rounded border px-2 py-1.5"><option value="TEXTO">Texto</option><option value="NUMERO">Número</option><option value="SELECCION">Selección</option><option value="BOOLEANO">Booleano</option></select>
              <input name="options" defaultValue={attribute.opciones ? (JSON.parse(attribute.opciones) as string[]).join(", ") : ""} placeholder="Opciones" className="rounded border px-2 py-1.5" />
              <div className="flex flex-wrap gap-3 sm:col-span-2"><label><input name="required" type="checkbox" defaultChecked={attribute.obligatorio} /> Obligatorio</label><label><input name="filterable" type="checkbox" defaultChecked={attribute.filtrable} /> Filtrable</label><label><input name="identity" type="checkbox" defaultChecked={attribute.identidad} /> Identidad</label><label><input name="active" type="checkbox" defaultChecked={attribute.activo} /> Activo</label></div>
              <button className="rounded border px-2 py-1.5">Guardar cambios</button>
            </form>
            {attribute.activo && <form action={deactivateFamilyAttributeAction} className="mt-2"><input type="hidden" name="id" value={attribute.id} /><button className="text-red-600">Desactivar</button></form>}
          </div>
        ))}
      </div>
    </section>
  );
}
