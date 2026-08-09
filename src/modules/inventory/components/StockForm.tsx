"use client";

import { useState, useEffect } from "react";
import { X, Calculator } from "lucide-react";
import { ajustarStock } from "@/modules/inventory/actions/stock.actions";

interface StockFormProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  sucursales: any[];
  preselectedProductId?: number | null;
}

export function StockForm({ isOpen, onClose, products, sucursales, preselectedProductId }: StockFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [productoId, setProductoId] = useState<number>(0);
  const [varianteId, setVarianteId] = useState<number>(0);
  const [sucursalId, setSucursalId] = useState<number>(0);
  const [tipoAjuste, setTipoAjuste] = useState("SUMAR"); // SUMAR, RESTAR, FIJAR
  
  // Valores de cantidad
  const [cantidadBase, setCantidadBase] = useState<number>(0);
  const [cajasInput, setCajasInput] = useState<string>("");
  const [m2Input, setM2Input] = useState<string>("");

  // Obtener detalles del producto seleccionado
  const selectedProduct = products.find(p => p.id === productoId);
  const selectedVariant = selectedProduct?.variantes?.find((variant: any) => variant.id === varianteId) ?? selectedProduct?.variantes?.[0];
  const isM2Product = selectedProduct?.unidadVenta === "M2";
  const isCajaProduct = selectedProduct?.unidadVenta === "CAJA";
  const m2PorCaja = selectedProduct?.m2PorCaja || null;
  const isTileProduct = (isM2Product || isCajaProduct) && m2PorCaja && m2PorCaja > 0;

  useEffect(() => {
    if (preselectedProductId) {
      setProductoId(preselectedProductId);
      setVarianteId(products.find((product) => product.id === preselectedProductId)?.variantes?.[0]?.id ?? 0);
    } else if (products.length > 0) {
      setProductoId(products[0].id);
      setVarianteId(products[0].variantes?.[0]?.id ?? 0);
    }
    
    if (sucursales.length > 0) {
      setSucursalId(sucursales[0].id);
    }

    setCantidadBase(0);
    setCajasInput("");
    setM2Input("");
    setError(null);
  }, [preselectedProductId, products, sucursales, isOpen]);

  // Recalcular cuando cambia el producto
  useEffect(() => {
    setCantidadBase(0);
    setCajasInput("");
    setM2Input("");
  }, [productoId]);

  if (!isOpen) return null;

  // Manejar cambios en el calculador
  const handleCajasChange = (valueStr: string) => {
    setCajasInput(valueStr);
    const val = parseFloat(valueStr);
    if (!isNaN(val) && m2PorCaja) {
      const calculatedM2 = val * m2PorCaja;
      setM2Input(calculatedM2.toFixed(3).replace(/\.?0+$/, "")); // Quitar ceros decimales innecesarios
      
      // La cantidad base a enviar
      if (isM2Product) {
        setCantidadBase(calculatedM2);
      } else {
        setCantidadBase(val); // Si la base es cajas
      }
    } else {
      setM2Input("");
      setCantidadBase(0);
    }
  };

  const handleM2Change = (valueStr: string) => {
    setM2Input(valueStr);
    const val = parseFloat(valueStr);
    if (!isNaN(val) && m2PorCaja) {
      const calculatedCajas = val / m2PorCaja;
      setCajasInput(calculatedCajas.toFixed(3).replace(/\.?0+$/, ""));
      
      // La cantidad base a enviar
      if (isM2Product) {
        setCantidadBase(val);
      } else {
        setCantidadBase(calculatedCajas);
      }
    } else {
      setCajasInput("");
      setCantidadBase(0);
    }
  };

  const handleBaseChange = (valueStr: string) => {
    const val = parseFloat(valueStr);
    if (!isNaN(val)) {
      setCantidadBase(val);
    } else {
      setCantidadBase(0);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Asegurarse de mandar la cantidad correcta calculada
    formData.set("cantidad", cantidadBase.toString());

    const res = await ajustarStock(formData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center pb-3 border-b mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calculator size={20} className="text-slate-500" />
            <span>Ajuste / Entrada de Stock</span>
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
          {/* Producto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Producto *</label>
            <select
              required
              name="productoId"
              value={productoId}
              onChange={(e) => { const id = parseInt(e.target.value); setProductoId(id); setVarianteId(products.find((product) => product.id === id)?.variantes?.[0]?.id ?? 0); }}
              disabled={!!preselectedProductId}
              className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400 bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value={0} disabled>Seleccionar producto...</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.codigo} - {prod.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Variante *</label>
            <select required name="varianteId" value={varianteId} onChange={(e) => setVarianteId(Number(e.target.value))} className="w-full rounded-md border bg-white p-2 text-sm">
              <option value={0} disabled>Seleccionar variante...</option>
              {(selectedProduct?.variantes ?? []).map((variant: any) => <option key={variant.id} value={variant.id}>{variant.sku}{variant.nombre ? ` - ${variant.nombre}` : ""}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
              <input type="hidden" name="sucursalId" value={sucursalId} />
              <div className="w-full rounded-md border bg-slate-50 p-2 text-sm">
                {sucursales[0]?.nombre ?? "Local principal"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs font-medium text-slate-700">Lote<input name="lote" type="text" className="mt-1 w-full rounded-md border p-2 text-sm uppercase" /></label>
              <label className="text-xs font-medium text-slate-700">Tono<input name="tono" type="text" className="mt-1 w-full rounded-md border p-2 text-sm uppercase" /></label>
              <label className="text-xs font-medium text-slate-700">Calibre<input name="calibre" type="text" className="mt-1 w-full rounded-md border p-2 text-sm uppercase" /></label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Tipo de Ajuste */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ajuste *</label>
              <select
                required
                name="tipoAjuste"
                value={tipoAjuste}
                onChange={(e) => setTipoAjuste(e.target.value)}
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400 bg-white"
              >
                <option value="SUMAR">Sumar al stock (+ Entrada)</option>
                <option value="RESTAR">Restar del stock (- Salida / Rotura)</option>
                <option value="FIJAR">Fijar stock exacto (= Inventario)</option>
              </select>
            </div>

            {/* Unidad Base Info */}
            <div className="flex flex-col justify-end">
              {selectedProduct && (
                <div className="p-2.5 bg-slate-50 border rounded-md text-xs text-slate-600">
                  <span className="font-semibold block mb-0.5">Configuración de Venta:</span>
                  Unidad: <span className="font-semibold">{selectedProduct.unidadVenta}</span>
                  {selectedVariant && <span className="block mt-0.5">Variante: <span className="font-semibold">{selectedVariant.sku}</span></span>}
                  {selectedProduct.m2PorCaja && (
                    <span className="block mt-0.5">Relación: <span className="font-semibold">{selectedProduct.m2PorCaja} m² por caja</span></span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cantidades con conversión interactiva */}
          <div className="bg-slate-50 p-4 rounded-xl border space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Cantidad a registrar</span>
            </h4>

            {isTileProduct ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cantidad en Cajas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">En Cajas (Cj)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={cajasInput}
                    onChange={(e) => handleCajasChange(e.target.value)}
                    placeholder="Cantidad de cajas"
                    className="w-full border rounded-md p-2 bg-white text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* Cantidad en Metros Cuadrados */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">En Metros Cuadrados (m²)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={m2Input}
                    onChange={(e) => handleM2Change(e.target.value)}
                    placeholder="Cantidad de metros"
                    className="w-full border rounded-md p-2 bg-white text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cantidad ({selectedProduct?.unidadVenta || "Unidades"})
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  onChange={(e) => handleBaseChange(e.target.value)}
                  placeholder="Ej. 100"
                  className="w-full border rounded-md p-2 bg-white text-sm outline-none focus:border-slate-400"
                />
              </div>
            )}

            {/* Resumen del envío */}
            {selectedProduct && (
              <div className="pt-2 text-xs text-slate-500 border-t flex justify-between">
                <span>Acción: <strong>{tipoAjuste}</strong></span>
                <span>Base a enviar: <strong>{cantidadBase} {selectedProduct.unidadVenta}</strong></span>
              </div>
            )}
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
              disabled={loading || cantidadBase <= 0}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              {loading ? "Registrando..." : "Confirmar Ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
