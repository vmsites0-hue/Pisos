"use client";

import { useState } from "react";
import { Store, Edit2, Trash2, X, Plus, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { updateSucursal, deleteSucursal, toggleSucursal } from "@/app/actions/sucursales";
import { createReglaDescuento, deleteReglaDescuento, toggleReglaDescuento } from "@/app/actions/descuentos";

interface ConfiguracionClientProps {
  sucursales: any[];
  reglas: any[];
  categories: any[];
}

export function ConfiguracionClient({ sucursales, reglas, categories }: ConfiguracionClientProps) {
  const [activeTab, setActiveTab] = useState<"sucursales" | "descuentos">("sucursales");

  // Edit sucursal
  const [editingSucursal, setEditingSucursal] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Regla de descuento
  const [isReglaModalOpen, setIsReglaModalOpen] = useState(false);
  const [reglaLoading, setReglaLoading] = useState(false);
  const [reglaError, setReglaError] = useState<string | null>(null);

  async function handleEditSucursal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSucursal) return;
    setEditLoading(true);
    setEditError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateSucursal(editingSucursal.id, formData);
    setEditLoading(false);

    if (res.error) {
      setEditError(res.error);
    } else {
      setEditingSucursal(null);
    }
  }

  async function handleDeleteSucursal(id: number, nombre: string) {
    if (!confirm(`¿Eliminar la sucursal "${nombre}"?\nSi tiene ventas históricas, se desactivará en vez de eliminarse.`)) return;
    const res = await deleteSucursal(id);
    if (res.error) {
      alert(res.error);
    }
  }

  async function handleToggleSucursal(id: number, currentState: boolean) {
    const res = await toggleSucursal(id, !currentState);
    if (res.error) alert(res.error);
  }

  async function handleCreateRegla(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReglaLoading(true);
    setReglaError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createReglaDescuento(formData);
    setReglaLoading(false);

    if (res.error) {
      setReglaError(res.error);
    } else {
      setIsReglaModalOpen(false);
    }
  }

  async function handleDeleteRegla(id: number, nombre: string) {
    if (!confirm(`¿Eliminar la regla "${nombre}"?`)) return;
    const res = await deleteReglaDescuento(id);
    if (res.error) alert(res.error);
  }

  async function handleToggleRegla(id: number, currentState: boolean) {
    const res = await toggleReglaDescuento(id, !currentState);
    if (res.error) alert(res.error);
  }

  const tipoLabel = (tipo: string) => {
    switch (tipo) {
      case "POR_VOLUMEN": return "Por Volumen (m²)";
      case "POR_MONTO": return "Por Monto (Gs.)";
      case "POR_CATEGORIA": return "Por Categoría";
      default: return tipo;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-slate-500">Sucursales, reglas de descuento y parámetros del sistema.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("sucursales")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "sucursales"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Sucursales
        </button>
        <button
          onClick={() => setActiveTab("descuentos")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "descuentos"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Descuentos Automáticos
        </button>
      </div>

      {/* Sucursales Tab */}
      {activeTab === "sucursales" && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Dirección</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sucursales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No hay sucursales registradas aún.
                  </td>
                </tr>
              ) : null}
              
              {sucursales.map((sucursal) => (
                <tr key={sucursal.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                      <Store size={16} />
                    </div>
                    {sucursal.nombre}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{sucursal.direccion || "-"}</td>
                  <td className="px-6 py-4 text-slate-600">{sucursal.telefono || "-"}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleSucursal(sucursal.id, sucursal.activa)}
                      className="cursor-pointer"
                      title={sucursal.activa ? "Clic para desactivar" : "Clic para activar"}
                    >
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        sucursal.activa 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {sucursal.activa ? "Activa" : "Inactiva"}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => { setEditingSucursal(sucursal); setEditError(null); }}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer" 
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSucursal(sucursal.id, sucursal.nombre)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer" 
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Descuentos Automáticos Tab */}
      {activeTab === "descuentos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Configura reglas que apliquen descuentos automáticamente al momento de la venta según volumen, monto o categoría.
            </p>
            <button
              onClick={() => { setReglaError(null); setIsReglaModalOpen(true); }}
              className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer text-sm font-medium flex-shrink-0"
            >
              <Plus size={18} />
              <span>Nueva Regla</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Regla</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Umbral Mínimo</th>
                  <th className="px-6 py-4 text-right">Descuento</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reglas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No hay reglas de descuento configuradas. Crea una para empezar.
                    </td>
                  </tr>
                ) : null}
                {reglas.map((regla) => (
                  <tr key={regla.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        <span className="font-semibold text-slate-900">{regla.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                        {tipoLabel(regla.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {regla.tipo === "POR_MONTO" 
                        ? new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(regla.umbralMinimo)
                        : `${regla.umbralMinimo} ${regla.tipo === "POR_VOLUMEN" ? "m²" : "unid."}`
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {regla.porcentajeDescuento}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleRegla(regla.id, regla.activa)}
                        className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium"
                        title={regla.activa ? "Desactivar" : "Activar"}
                      >
                        {regla.activa ? (
                          <><ToggleRight size={20} className="text-emerald-600" /> <span className="text-emerald-700">Activa</span></>
                        ) : (
                          <><ToggleLeft size={20} className="text-slate-400" /> <span className="text-slate-500">Inactiva</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteRegla(regla.id, regla.nombre)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Editar Sucursal */}
      {editingSucursal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Editar Sucursal</h3>
              <button onClick={() => setEditingSucursal(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSucursal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input name="nombre" defaultValue={editingSucursal.nombre} required className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
                <input name="direccion" defaultValue={editingSucursal.direccion || ""} className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
                <input name="telefono" defaultValue={editingSucursal.telefono || ""} className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400" />
              </div>
              {editError && <p className="text-xs text-red-600 font-medium">{editError}</p>}
              <button
                type="submit"
                disabled={editLoading}
                className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {editLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Regla de Descuento */}
      {isReglaModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Nueva Regla de Descuento</h3>
              <button onClick={() => setIsReglaModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRegla} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la regla *</label>
                <input name="nombre" required placeholder="Ej: Descuento mayorista" className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de regla *</label>
                <select name="tipo" required className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400">
                  <option value="POR_VOLUMEN">Por Volumen (m² total del carrito)</option>
                  <option value="POR_MONTO">Por Monto (Gs. subtotal del carrito)</option>
                  <option value="POR_CATEGORIA">Por Categoría (m² de una categoría)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Categoría (solo para tipo &quot;Por Categoría&quot;)</label>
                <select name="categoriaId" className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400">
                  <option value="">— No aplica —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Umbral mínimo *</label>
                <input name="umbralMinimo" type="number" step="0.01" required placeholder="Ej: 20 (m²) o 500000 (Gs.)" className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400" />
                <p className="text-[10px] text-slate-400 mt-0.5">Si tipo = Volumen → m². Si tipo = Monto → Gs.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Porcentaje de descuento (%) *</label>
                <input name="porcentajeDescuento" type="number" step="0.5" min="0.5" max="100" required placeholder="Ej: 5" className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400" />
              </div>
              {reglaError && <p className="text-xs text-red-600 font-medium">{reglaError}</p>}
              <button
                type="submit"
                disabled={reglaLoading}
                className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {reglaLoading ? "Guardando..." : "Crear Regla"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
