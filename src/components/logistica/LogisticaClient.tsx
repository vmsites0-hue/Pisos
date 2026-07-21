"use client";

import { useState } from "react";
import { 
  Truck, 
  Check, 
  Search, 
  Calendar, 
  User, 
  Package, 
  Store,
  Clock,
  ClipboardList,
  AlertCircle,
  X
} from "lucide-react";
import { actualizarEstadoEnvio } from "@/app/actions/logistica";

interface LogisticaClientProps {
  sales: any[];
  sucursales: any[];
}

export function LogisticaClient({ sales, sucursales }: LogisticaClientProps) {
  const [activeTab, setActiveTab] = useState<"PENDIENTE" | "ENCARGADO" | "DESPACHADO" | "ENTREGADO">("PENDIENTE");
  const [searchQuery, setSearchQuery] = useState("");
  const [sucursalFilter, setSucursalFilter] = useState("all");
  
  // Modales de transición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"ENCARGADO" | "DESPACHADO" | "ENTREGADO">("ENCARGADO");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  
  // Inputs del modal
  const [chofer, setChofer] = useState("");
  const [encargado, setEncargado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  // Filtrar ventas
  const filteredSales = sales.filter((sale) => {
    const matchesTab = sale.estado === activeTab;
    const matchesBranch = sucursalFilter === "all" || sale.sucursalId === parseInt(sucursalFilter);
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      sale.id.toString().includes(query) ||
      sale.cliente.nombre.toLowerCase().includes(query) ||
      sale.cliente.apellido.toLowerCase().includes(query) ||
      sale.cliente.documento.includes(query) ||
      (sale.chofer && sale.chofer.toLowerCase().includes(query)) ||
      (sale.observaciones && sale.observaciones.toLowerCase().includes(query)) ||
      sale.detalles.some((d: any) => d.producto.nombre.toLowerCase().includes(query) || d.producto.codigo.toLowerCase().includes(query));

    return matchesTab && matchesBranch && matchesSearch;
  });

  const openTransitionModal = (saleId: number, type: "ENCARGADO" | "DESPACHADO" | "ENTREGADO") => {
    setSelectedSaleId(saleId);
    setModalType(type);
    setChofer("");
    setEncargado("");
    setObservaciones("");
    setIsModalOpen(true);
  };

  async function handleConfirmarTransicion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSaleId) return;

    setLoading(true);
    let finalObservacion = observaciones.trim();

    // Si pasamos a encargado, guardamos el encargado en la nota
    if (modalType === "ENCARGADO") {
      finalObservacion = `[Preparado por: ${encargado.trim()}] ${finalObservacion}`;
    }

    const res = await actualizarEstadoEnvio(
      selectedSaleId, 
      modalType, 
      modalType === "DESPACHADO" ? chofer.trim() : undefined,
      finalObservacion ? finalObservacion : undefined
    );
    
    setLoading(false);
    if (res.error) {
      alert(res.error);
    } else {
      setIsModalOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Despachos y Logística</h2>
        <p className="text-slate-500">Monitorea y despacha las entregas de materiales a tus clientes.</p>
      </div>

      {/* Selector de Pestañas (Tabs) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("PENDIENTE")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "PENDIENTE"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Pendiente ({sales.filter(s => s.estado === "PENDIENTE").length})
        </button>
        <button
          onClick={() => setActiveTab("ENCARGADO")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "ENCARGADO"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Encargado / Preparación ({sales.filter(s => s.estado === "ENCARGADO").length})
        </button>
        <button
          onClick={() => setActiveTab("DESPACHADO")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "DESPACHADO"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          En Camino ({sales.filter(s => s.estado === "DESPACHADO").length})
        </button>
        <button
          onClick={() => setActiveTab("ENTREGADO")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "ENTREGADO"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Entregado ({sales.filter(s => s.estado === "ENTREGADO").length})
        </button>
      </div>

      {/* Buscadores y Filtros */}
      <div className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nro. venta, cliente, chofer u observaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border rounded-md px-3 py-1.5">
          <Store size={16} className="text-slate-400" />
          <select
            value={sucursalFilter}
            onChange={(e) => setSucursalFilter(e.target.value)}
            className="bg-transparent text-sm border-none outline-none text-slate-700 bg-white"
          >
            <option value="all">Todas las Sucursales</option>
            {sucursales.map((suc) => (
              <option key={suc.id} value={suc.id}>{suc.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de entregas */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-slate-400 italic text-sm">
            No se encontraron envíos para el estado actual.
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow transition-all space-y-4">
              
              {/* Fila superior: ID, Fecha, Sucursal, Estado */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">Venta #{sale.id}</span>
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                    <Calendar size={12} />
                    <span>{new Date(sale.fecha).toLocaleString("es-PY")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                    <Store size={12} />
                    <span>{sale.sucursal.nombre}</span>
                  </div>
                  {sale.tipoEntrega && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      sale.tipoEntrega === "RETIRO" 
                        ? "bg-slate-100 text-slate-700 border-slate-200" 
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}>
                      {sale.tipoEntrega === "RETIRO" ? "Retiro en Local" : "Envío a Domicilio"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Badge de estado */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    sale.estado === "PENDIENTE"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : sale.estado === "ENCARGADO"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : sale.estado === "DESPACHADO"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {sale.estado === "PENDIENTE" 
                      ? "Pendiente" 
                      : sale.estado === "ENCARGADO" 
                      ? "Encargado (Preparando)" 
                      : sale.estado === "DESPACHADO" 
                      ? "En camino" 
                      : "Entregado"}
                  </span>

                  {/* Acciones */}
                  {sale.estado === "PENDIENTE" && (
                    <button
                      onClick={() => openTransitionModal(sale.id, "ENCARGADO")}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ClipboardList size={14} />
                      <span>Asignar Encargado</span>
                    </button>
                  )}

                  {sale.estado === "ENCARGADO" && (
                    <button
                      onClick={() => openTransitionModal(sale.id, "DESPACHADO")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Truck size={14} />
                      <span>Despachar (En Camino)</span>
                    </button>
                  )}

                  {sale.estado === "DESPACHADO" && (
                    <button
                      onClick={() => openTransitionModal(sale.id, "ENTREGADO")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Confirmar Entrega</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Fila central: Datos del Cliente y Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* Cliente */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User size={12} />
                    <span>Datos de Entrega</span>
                  </h4>
                  <div className="font-semibold text-slate-800">{sale.cliente.nombre} {sale.cliente.apellido}</div>
                  <div className="text-slate-500 text-xs">CI/DNI: {sale.cliente.documento}</div>
                  {sale.cliente.telefono && <div className="text-slate-500 text-xs">Teléf: {sale.cliente.telefono}</div>}
                  {sale.cliente.direccion && <div className="text-slate-500 text-xs italic mt-1">Dirección: {sale.cliente.direccion}</div>}
                  
                  {/* Chofer asignado */}
                  {sale.chofer && (
                    <div className="mt-3 p-2 bg-slate-50 border rounded text-xs text-slate-700 flex items-center gap-1">
                      <Truck size={12} className="text-slate-400" />
                      <span><strong>Chofer:</strong> {sale.chofer}</span>
                    </div>
                  )}

                  {/* Notas de Observación */}
                  {sale.observaciones && (
                    <div className="mt-2 p-2 bg-slate-50 border border-amber-100 rounded text-xs text-slate-700">
                      <strong>Nota de Obs:</strong> {sale.observaciones}
                    </div>
                  )}
                </div>

                {/* Detalles de Productos */}
                <div className="md:col-span-2 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Package size={12} />
                    <span>Materiales a Entregar</span>
                  </h4>
                  <div className="border rounded-lg bg-slate-50 divide-y overflow-hidden max-h-[150px] overflow-y-auto">
                    {sale.detalles.map((det: any) => (
                      <div key={det.id} className="flex justify-between items-center p-2.5 text-xs">
                        <div className="font-medium text-slate-700">
                          {det.producto.codigo} - {det.producto.nombre}
                        </div>
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border">
                          {det.cantidad} {det.producto.unidadVenta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE TRANSICIÓN LOGÍSTICA */}
      {isModalOpen && selectedSaleId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl border">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Truck className="text-slate-500" size={18} />
                <span>
                  {modalType === "ENCARGADO" && "Asignar Encargado"}
                  {modalType === "DESPACHADO" && "Confirmar Despacho (En camino)"}
                  {modalType === "ENTREGADO" && "Confirmar Entrega Final"}
                </span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarTransicion} className="space-y-4">
              {modalType === "ENCARGADO" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Encargado de Preparación *</label>
                  <input
                    required
                    type="text"
                    value={encargado}
                    onChange={(e) => setEncargado(e.target.value)}
                    placeholder="Ej. Carlos González"
                    className="w-full border rounded p-2 text-sm bg-white outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {modalType === "DESPACHADO" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nombre del Chofer / Repartidor *</label>
                  <input
                    required
                    type="text"
                    value={chofer}
                    onChange={(e) => setChofer(e.target.value)}
                    placeholder="Ej. Raúl Benítez"
                    className="w-full border rounded p-2 text-sm bg-white outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {/* Observación general (nota de observación) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nota de Observación</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  placeholder="Detalles de entrega, horario sugerido, etc."
                  className="w-full border rounded p-2 text-sm bg-white outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6 font-semibold">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
