"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createProducto, updateProducto } from "@/modules/inventory/actions/products.actions";
import { createCategoria } from "@/modules/inventory/actions/categories.actions";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any; // Si existe, es edición. Si no, creación.
  categories: { id: number; nombre: string; familia?: { atributos: { id: number; nombre: string; tipo: string; obligatorio: boolean; opciones: string | null }[] } | null }[];
  units: { id: number; codigo: string; nombre: string; simbolo: string; precision: number; admiteDecimales: boolean }[];
}

export function ProductForm({ isOpen, onClose, product, categories = [], units = [] }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unidadVenta, setUnidadVenta] = useState("UNIDAD");
  const [unidadBaseId, setUnidadBaseId] = useState("");
  const [permiteFraccion, setPermiteFraccion] = useState(false);
  
  // Categoría seleccionada e inline
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showInlineCat, setShowInlineCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setUnidadVenta(product.unidadVenta || "UNIDAD");
      setUnidadBaseId(product.variantes?.[0]?.unidadBaseId?.toString() || units.find((unit) => unit.codigo === product.unidadVenta)?.id.toString() || "");
      setPermiteFraccion(product.permiteFraccion || false);
      setSelectedCategory(product.categoriaId?.toString() || "");
    } else {
      setUnidadVenta("UNIDAD");
      setUnidadBaseId(units.find((unit) => unit.codigo === "UNIDAD")?.id.toString() || units[0]?.id.toString() || "");
      setPermiteFraccion(false);
      setSelectedCategory("");
    }
    setShowInlineCat(false);
    setNewCatName("");
    setCatError(null);
  }, [product, isOpen, units]);

  async function handleAddCategoryInline(e: React.MouseEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatLoading(true);
    setCatError(null);
    const res = await createCategoria(newCatName);
    setCatLoading(false);

    if (res.error) {
      setCatError(res.error);
    } else if (res.category) {
      setSelectedCategory(res.category.id.toString());
      setNewCatName("");
      setShowInlineCat(false);
      router.refresh();
    }
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("permiteFraccion", permiteFraccion.toString());

    let res;
    if (product) {
      res = await updateProducto(product.id, formData);
    } else {
      res = await createProducto(formData);
    }

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
      onClose();
    }
  }

  const isM2OrCaja = unidadVenta === "M2" || unidadVenta === "CAJA";
  const primaryVariant = product?.variantes?.[0];
  const extraPresentation = primaryVariant?.presentaciones?.find((item: any) => !item.predeterminada);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center pb-3 border-b mb-4">
          <h3 className="text-xl font-bold">
            {product ? "Editar Producto" : "Nuevo Producto"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código Único *</label>
              <input
                required
                name="codigo"
                type="text"
                defaultValue={product?.codigo || ""}
                placeholder="Ej. POR-PORT-60"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400 uppercase"
              />
            </div>

            {/* Código de Barras */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras (Opcional)</label>
              <input
                name="codigoBarras"
                type="text"
                defaultValue={product?.codigoBarras || ""}
                placeholder="EAN-13, etc."
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto *</label>
              <input
                required
                name="nombre"
                type="text"
                defaultValue={product?.nombre || ""}
                placeholder="Ej. Porcelanato Portobello Beige 60x60"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca (Opcional)</label>
              <input
                name="marca"
                type="text"
                defaultValue={product?.marca || ""}
                placeholder="Ej. Portobello"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Descripción e Imagen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
              <input
                name="descripcion"
                type="text"
                defaultValue={product?.descripcion || ""}
                placeholder="Detalles sobre acabado, calidad, procedencia, etc."
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Imágenes (una URL por línea)</label>
              <textarea
                name="imagenes"
                rows={3}
                defaultValue={(product?.imagenes?.map((image: any) => image.url) ?? (product?.imagenUrl ? [product.imagenUrl] : [])).join("\n")}
                placeholder={"https://.../principal.jpg\nhttps://.../detalle.jpg"}
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categoría */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Categoría *</label>
                {!showInlineCat && (
                  <button
                    type="button"
                    onClick={() => { setShowInlineCat(true); setCatError(null); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    + Nueva
                  </button>
                )}
              </div>
              
              {showInlineCat ? (
                <div className="space-y-1.5 border p-2 rounded bg-slate-50">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nombre categoría"
                    className="w-full border rounded p-1.5 text-xs outline-none bg-white focus:border-slate-400"
                  />
                  {catError && <p className="text-[10px] text-red-600 font-medium">{catError}</p>}
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowInlineCat(false)}
                      className="px-2 py-0.5 border text-[10px] rounded hover:bg-slate-100 text-slate-600 cursor-pointer font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={catLoading || !newCatName.trim()}
                      onClick={handleAddCategoryInline}
                      className="px-2 py-0.5 bg-slate-900 text-white text-[10px] rounded hover:bg-slate-800 disabled:opacity-50 cursor-pointer font-medium"
                    >
                      {catLoading ? "Agregando..." : "Agregar"}
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  required
                  name="categoriaId"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400 bg-white"
                >
                  <option value="" disabled>Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Unidad de Venta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Venta *</label>
              <select
                required
                name="unidadBaseId"
                value={unidadBaseId}
                onChange={(e) => { setUnidadBaseId(e.target.value); setUnidadVenta(units.find((unit) => unit.id.toString() === e.target.value)?.codigo ?? "UNIDAD"); }}
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400 bg-white"
              >
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.nombre} ({unit.simbolo})</option>)}
              </select>
            </div>

            {/* m2 por caja */}
            <div>
              <label className={`block text-sm font-medium text-slate-700 mb-1 ${!isM2OrCaja && "opacity-50"}`}>
                Factor de presentación
              </label>
              <input
                required={isM2OrCaja}
                disabled={!isM2OrCaja}
                name="m2PorCaja"
                type="number"
                step="0.001"
                min="0.001"
                defaultValue={extraPresentation?.factorConversion || product?.m2PorCaja || ""}
                placeholder={isM2OrCaja ? "Ej. 2.08" : "No aplica"}
                className={`w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400 ${
                  !isM2OrCaja && "bg-slate-50 cursor-not-allowed"
                }`}
              />
            </div>
          </div>

          {/* Permite Fracción (checkbox adaptado a botón deslizable o checkbox común) */}
          {isM2OrCaja && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
              <input
                id="permiteFraccion"
                type="checkbox"
                checked={permiteFraccion}
                onChange={(e) => setPermiteFraccion(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
              />
              <label htmlFor="permiteFraccion" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                Permitir venta fraccionada (Ej: vender $m^2$ individuales abriendo una caja)
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 rounded-lg border p-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Política de venta</label>
              <select key={primaryVariant?.politicaVenta || unidadVenta} name="politicaVenta" defaultValue={primaryVariant?.politicaVenta || (unidadVenta === "M2" ? "SOLO_CAJAS_COMPLETAS" : "UNIDADES_ENTERAS")} className="w-full rounded-md border bg-white p-2 text-sm">
                <option value="SOLO_CAJAS_COMPLETAS">Solo cajas completas</option><option value="CANTIDAD_EXACTA">Cantidad exacta</option><option value="CAJAS_Y_FRACCION">Cajas y fracción</option><option value="UNIDADES_ENTERAS">Unidades enteras</option><option value="MULTIPLO_CONFIGURABLE">Múltiplo configurable</option>
              </select>
            </div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Múltiplo de venta</label><input name="multiploVenta" type="number" min="0.001" step="0.001" defaultValue={primaryVariant?.multiploVenta || ""} className="w-full rounded-md border p-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Nombre presentación</label><input name="nombrePresentacion" defaultValue={extraPresentation?.nombre || (isM2OrCaja ? "Caja" : "")} placeholder="Caja, pallet, juego…" className="w-full rounded-md border p-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Unidad presentación</label><select name="unidadPresentacionId" defaultValue={extraPresentation?.unidadId || units.find((unit) => unit.codigo === "CAJA")?.id || ""} className="w-full rounded-md border bg-white p-2 text-sm"><option value="">No aplica</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.nombre}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Piezas</label><input name="piezasPresentacion" type="number" min="1" step="1" defaultValue={extraPresentation?.piezas || ""} className="w-full rounded-md border p-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Descripción presentación</label><input name="descripcionPresentacion" defaultValue={extraPresentation?.descripcion || ""} className="w-full rounded-md border p-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Precio de presentación</label><select name="modoPrecioPresentacion" defaultValue={extraPresentation?.modoPrecio || "DERIVADO"} className="w-full rounded-md border bg-white p-2 text-sm"><option value="DERIVADO">Derivado por conversión</option><option value="ESPECIFICO">Precio específico</option></select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Precio neto específico</label><input name="precioNetoPresentacion" type="number" min="0" step="0.01" defaultValue={extraPresentation?.precioNeto ?? ""} className="w-full rounded-md border p-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Impuesto (%)</label><input name="impuestoPresentacion" type="number" min="0" step="0.01" defaultValue={extraPresentation?.impuesto ?? 0} className="w-full rounded-md border p-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Precio final específico</label><input name="precioFinalPresentacion" type="number" min="0" step="0.01" defaultValue={extraPresentation?.precioFinal ?? ""} className="w-full rounded-md border p-2 text-sm" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Moneda</label><select name="monedaPresentacion" defaultValue={extraPresentation?.moneda || "PYG"} className="w-full rounded-md border bg-white p-2 text-sm"><option value="PYG">PYG</option><option value="USD">USD</option></select></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Precio Compra */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Compra *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">Gs.</span>
                <input
                  required
                  name="precioCompra"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.precioCompra || ""}
                  placeholder="0"
                  className="w-full border rounded-md pl-10 pr-2 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Precio Venta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">Gs.</span>
                <input
                  required
                  name="precioVenta"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.precioVenta || ""}
                  placeholder="0"
                  className="w-full border rounded-md pl-10 pr-2 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Stock Mínimo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo Alerta</label>
              <input
                name="stockMinimo"
                type="number"
                min="0"
                step="0.1"
                defaultValue={product?.stockMinimo || "0"}
                placeholder="Ej. 5"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              {loading ? "Guardando..." : product ? "Guardar Cambios" : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
