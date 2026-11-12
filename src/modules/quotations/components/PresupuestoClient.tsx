"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  Percent, 
  CheckCircle,
  Printer,
  Calendar,
  X,
  Download
} from "lucide-react";
import { actualizarPresupuesto, compararVariacionesPresupuesto, crearPresupuesto, eliminarPresupuesto, recalcularPresupuesto } from "@/modules/quotations/actions/quotations.actions";
import { generateQuotationPDF } from "@/lib/pdf-generator";
import { ManualReservationForm } from "@/modules/reservations/components/ManualReservationForm";
import { ReservationActions } from "@/modules/reservations/components/ReservationActions";

interface PresupuestoClientProps {
  products: any[];
  clientes: any[];
  categories: any[];
  presupuestos: any[];
}

export function PresupuestoClient({ products, clientes, categories, presupuestos }: PresupuestoClientProps) {
  const [activeTab, setActiveTab] = useState<"crear" | "lista">("crear");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [clienteId, setClienteId] = useState<number>(0);
  const [cart, setCart] = useState<any[]>([]);
  const [descuento, setDescuento] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expirationMode, setExpirationMode] = useState<"NONE" | "DEFAULT" | "CUSTOM">("NONE");
  const [customExpiration, setCustomExpiration] = useState("");
  const [recalculationPolicy, setRecalculationPolicy] = useState("CONSERVAR");

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showReceipt, setShowReceipt] = useState(false);
  const [createdPresupuesto, setCreatedPresupuesto] = useState<any>(null);
  const [variationReport, setVariationReport] = useState<any>(null);

  const handleDownloadPDF = async () => {
    if (!createdPresupuesto) return;
    setDownloading(true);
    setError(null);
    try {
      generateQuotationPDF(createdPresupuesto);
    } catch (err: any) {
      console.error(err);
      setError("Error al generar el PDF del presupuesto.");
    } finally {
      setDownloading(false);
    }
  };

  // Inicializar cliente general
  useEffect(() => {
    if (clientes.length > 0) {
      const general = clientes.find(c => c.nombre.toLowerCase().includes("general") || c.apellido.toLowerCase().includes("general"));
      setClienteId(general ? general.id : clientes[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar productos
  const filteredProducts = products.filter((prod) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      prod.nombre.toLowerCase().includes(query) || 
      prod.codigo.toLowerCase().includes(query) ||
      (prod.marca && prod.marca.toLowerCase().includes(query));

    const matchesCategory = categoryFilter === "all" || prod.categoriaId === parseInt(categoryFilter);

    return matchesSearch && matchesCategory;
  });

  // Agregar al carrito
  const addToCart = (prod: any) => {
    const existingIndex = cart.findIndex(item => item.productoId === prod.id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].cantidad += 1;
      
      if (prod.m2PorCaja && prod.m2PorCaja > 0) {
        if (prod.unidadVenta === "M2") {
          newCart[existingIndex].cajas = (newCart[existingIndex].cantidad / prod.m2PorCaja).toFixed(3);
        } else if (prod.unidadVenta === "CAJA") {
          newCart[existingIndex].cajas = newCart[existingIndex].cantidad.toString();
        }
      }
      setCart(newCart);
    } else {
      let initialCajas = "";
      if (prod.m2PorCaja && prod.m2PorCaja > 0) {
        if (prod.unidadVenta === "M2") {
          initialCajas = (1 / prod.m2PorCaja).toFixed(3);
        } else if (prod.unidadVenta === "CAJA") {
          initialCajas = "1";
        }
      }

      setCart([
        ...cart,
        {
          productoId: prod.id,
          varianteId: prod.variantes?.[0]?.id,
          codigo: prod.codigo,
          nombre: prod.nombre,
          unidadVenta: prod.unidadVenta,
          m2PorCaja: prod.m2PorCaja,
          precioVenta: prod.precioVenta,
          cantidad: 1,
          cajas: initialCajas,
        }
      ]);
    }
  };

  // Cambiar cantidad en carrito
  const updateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(index);
      return;
    }
    const newCart = [...cart];
    const item = cart[index];
    newCart[index].cantidad = newQty;
    
    if (item.m2PorCaja && item.m2PorCaja > 0) {
      if (item.unidadVenta === "M2") {
        newCart[index].cajas = (newQty / item.m2PorCaja).toFixed(3);
      } else if (item.unidadVenta === "CAJA") {
        newCart[index].cajas = newQty.toString();
      }
    }
    setCart(newCart);
  };

  const handleCartCajasChange = (index: number, valStr: string) => {
    const item = cart[index];
    const val = parseFloat(valStr);
    const newCart = [...cart];
    newCart[index].cajas = valStr;

    if (!isNaN(val) && item.m2PorCaja) {
      let calculatedQty = val;
      if (item.unidadVenta === "M2") {
        calculatedQty = val * item.m2PorCaja;
      }
      newCart[index].cantidad = parseFloat(calculatedQty.toFixed(3));
    }
    setCart(newCart);
  };

  const handleCartM2Change = (index: number, valStr: string) => {
    const item = cart[index];
    const val = parseFloat(valStr);
    const newCart = [...cart];
    newCart[index].cantidad = isNaN(val) ? 0 : val;

    if (!isNaN(val) && item.m2PorCaja) {
      newCart[index].cajas = (val / item.m2PorCaja).toFixed(3);
    }
    setCart(newCart);
  };

  const removeCartItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.cantidad * curr.precioVenta), 0);
  const total = Math.max(0, subtotal - descuento);

  // Guardar Presupuesto
  async function handleGuardarPresupuesto() {
    if (cart.length === 0) return;
    setLoading(true);
    setError(null);

    const inputData = {
      clienteId,
      descuento,
      expirationMode,
      customExpiration: expirationMode === "CUSTOM" ? customExpiration : null,
      recalculationPolicy,
      detalles: cart.map(item => ({
        productoId: item.productoId,
        varianteId: item.varianteId,
        cantidad: item.cantidad,
        precioUnitario: item.precioVenta
      }))
    };

    const res = editingId ? await actualizarPresupuesto(editingId, inputData) : await crearPresupuesto(inputData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.presupuesto) {
      setCreatedPresupuesto(res.presupuesto);
      setCart([]);
      setDescuento(0);
      setEditingId(null); setExpirationMode("NONE"); setCustomExpiration(""); setRecalculationPolicy("CONSERVAR");
      setShowReceipt(true);
    }
  }

  // Eliminar Presupuesto
  async function handleDeletePresupuesto(id: number) {
    if (!confirm("¿Estás seguro de eliminar este presupuesto?")) return;
    const res = await eliminarPresupuesto(id);
    if (res.error) {
      alert(res.error);
    }
  }

  const handleViewPresupuesto = (p: any) => {
    setCreatedPresupuesto(p);
    setShowReceipt(true);
  };

  const handleEditPresupuesto = (p: any) => {
    setEditingId(p.id); setClienteId(p.clienteId); setDescuento(p.descuento);
    setExpirationMode(p.venceEn ? "CUSTOM" : "NONE");
    setCustomExpiration(p.venceEn ? new Date(new Date(p.venceEn).getTime() - new Date(p.venceEn).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
    setRecalculationPolicy(p.politicaRecalculo ?? "CONSERVAR");
    setCart(p.detalles.map((detail: any) => ({ productoId: detail.productoId, varianteId: detail.varianteId, codigo: detail.producto.codigo, nombre: detail.producto.nombre, unidadVenta: detail.producto.unidadVenta, m2PorCaja: detail.producto.m2PorCaja, precioVenta: detail.precioUnitario, cantidad: detail.cantidadSolicitada ?? detail.cantidad, cajas: detail.cantidadPresentacion?.toString() ?? "" })));
    setActiveTab("crear"); setError(null);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 no-print">
        {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Presupuestos y Cotizaciones</h2>
          <p className="text-slate-500">Genera presupuestos para tus clientes sin alterar el stock físico.</p>
        </div>
      </div>

      {/* Selector de Pestañas (Tabs) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("crear")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "crear"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Crear Presupuesto
        </button>
        <button
          onClick={() => setActiveTab("lista")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "lista"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Presupuestos Guardados ({presupuestos.length})
        </button>
      </div>

      {/* VISTA: LISTADO DE PRESUPUESTOS */}
      {activeTab === "lista" && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Nro. Presupuesto</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-right">Validez</th>
                <th className="px-6 py-4 text-right">Monto Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {presupuestos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                    No hay presupuestos guardados aún.
                  </td>
                </tr>
              ) : (
                presupuestos.map((p) => {
                  const limiteFecha = p.venceEn ? new Date(p.venceEn) : null;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">#PRES-{p.id}<span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px]">{p.estado}</span></td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(p.fecha).toLocaleDateString("es-PY")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{p.cliente.nombre} {p.cliente.apellido}</div>
                        <div className="text-[10px] text-slate-500">CI: {p.cliente.documento}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">
                        {limiteFecha ? `Hasta ${limiteFecha.toLocaleDateString("es-PY")}` : "Sin vencimiento"}
                        {p.reservas?.map((reservation: any) => <span key={reservation.id} className="mt-1 block text-[10px] text-blue-700">Reserva #{reservation.id}: {reservation.estado}{reservation.venceEn ? ` · vence ${new Date(reservation.venceEn).toLocaleString("es-PY")}` : " · sin vencimiento"}</span>)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {formatMoney(p.total)}
                      </td>
                      <td className="px-6 py-4 text-center space-x-1.5">
                        <ManualReservationForm quotation={p} />
                        {p.reservas?.map((reservation: any) => <ReservationActions key={reservation.id} reservation={reservation} />)}
                        <button
                          onClick={() => handleViewPresupuesto(p)}
                          className="px-2 py-1 text-xs border rounded bg-white text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                        >
                          Ver / Imprimir
                        </button>
                        {p.estado === "ABIERTO" && <button onClick={() => handleEditPresupuesto(p)} className="rounded border bg-white px-2 py-1 text-xs font-semibold text-slate-600">Editar</button>}
                        {p.estado === "ABIERTO" && p.politicaRecalculo === "MANUAL" && <button onClick={async () => { const result = await recalcularPresupuesto(p.id); if (result.error) alert(result.error); else alert(result.changed ? "Presupuesto actualizado por variaciones." : "No hubo variaciones; no se modificó."); }} className="rounded border bg-white px-2 py-1 text-xs font-semibold text-emerald-700">Recalcular</button>}
                        {p.estado === "ABIERTO" && <button onClick={async () => { const result = await compararVariacionesPresupuesto(p.id); if (result.error) alert(result.error); else if (!result.hasVariations) alert("No existen variaciones comerciales."); else setVariationReport({ ...result, quotationId: p.id }); }} className="rounded border bg-white px-2 py-1 text-xs font-semibold text-amber-700">Comparar</button>}
                        <button
                          onClick={() => handleDeletePresupuesto(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors inline-block cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA: CREAR PRESUPUESTO */}
      {activeTab === "crear" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PANEL IZQUIERDO: Catalogo */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-4 rounded-xl border flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
                <Search size={16} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar producto por nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-400"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded-md px-2 py-1.5 text-xs bg-white outline-none focus:border-slate-400"
              >
                <option value="all">Todas las Categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl border overflow-y-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-medium sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Código / Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{prod.codigo}</div>
                        <div className="text-slate-500 font-medium">{prod.nombre}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border text-[10px] text-slate-600 font-medium">
                          {prod.categoria.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatMoney(prod.precioVenta)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => addToCart(prod)}
                          className="bg-slate-950 hover:bg-slate-800 text-white p-1 rounded transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PANEL DERECHO: Carrito */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border flex flex-col justify-between space-y-4">
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="text-slate-700" size={18} />
                  <span>Ítems Presupuestados</span>
                </h3>
                <span className="px-2 py-0.5 bg-slate-100 border text-xs font-semibold rounded-full text-slate-600">
                  {cart.length} ítems
                </span>
              </div>

              {/* Selector de Cliente */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <User size={12} />
                  <span>Destinatario *</span>
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(parseInt(e.target.value))}
                  className="w-full border rounded-md p-2 text-sm bg-white outline-none focus:border-slate-400 font-semibold"
                >
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido} (CI: {c.documento})
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Carrito */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px]">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-400 py-12 text-xs italic">
                    El carrito está vacío. Agrega productos de la lista.
                  </div>
                ) : (
                  cart.map((item, index) => {
                    const isTile = item.m2PorCaja && item.m2PorCaja > 0;
                    
                    return (
                      <div key={item.productoId} className="p-3 border rounded-lg hover:border-slate-300 transition-colors space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-xs text-slate-900">{item.codigo}</div>
                            <div className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{item.nombre}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xs">{formatMoney(item.precioVenta)}</div>
                            <div className="text-[10px] text-slate-400">Total: {formatMoney(item.cantidad * item.precioVenta)}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          {isTile ? (
                            <div className="flex gap-2 items-center flex-1">
                              <div className="flex flex-col">
                                <label className="text-[9px] text-slate-400 font-semibold mb-0.5">Cajas (Cj)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={item.cajas}
                                  onChange={(e) => handleCartCajasChange(index, e.target.value)}
                                  className="border rounded p-1 text-center text-xs w-16 bg-white outline-none"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-[9px] text-slate-400 font-semibold mb-0.5">Metros (m²)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.cantidad}
                                  onChange={(e) => handleCartM2Change(index, e.target.value)}
                                  className="border rounded p-1 text-center text-xs w-20 bg-white outline-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-1">
                              <button 
                                type="button"
                                onClick={() => updateQty(index, item.cantidad - 1)}
                                className="p-1 border rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-10 text-center font-bold text-xs">{item.cantidad}</span>
                              <button 
                                type="button"
                                onClick={() => updateQty(index, item.cantidad + 1)}
                                className="p-1 border rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => removeCartItem(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Totales y envío */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Percent size={10} />
                  <span>Descuento (Gs.)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={descuento}
                  onChange={(e) => setDescuento(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full border rounded-md p-1.5 text-xs bg-white outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Descuento:</span>
                  <span>- {formatMoney(descuento)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-1.5 text-slate-900">
                  <span>Total Presupuestado:</span>
                  <span className="text-base text-slate-950">{formatMoney(total)}</span>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-2"><label className="text-xs font-medium">Vigencia<select value={expirationMode} onChange={(event) => setExpirationMode(event.target.value as typeof expirationMode)} className="mt-1 w-full rounded border bg-white p-2"><option value="NONE">Sin vencimiento</option><option value="DEFAULT">Predeterminada</option><option value="CUSTOM">Fecha específica</option></select></label>{expirationMode === "CUSTOM" && <label className="text-xs font-medium">Vence en<input required type="datetime-local" value={customExpiration} onChange={(event) => setCustomExpiration(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>}<label className="text-xs font-medium">Política de recálculo<select value={recalculationPolicy} onChange={(event) => setRecalculationPolicy(event.target.value)} className="mt-1 w-full rounded border bg-white p-2"><option value="CONSERVAR">Conservar valores originales</option><option value="MANUAL">Recalcular manualmente</option><option value="AL_CONVERTIR">Recalcular al convertir</option></select></label></div>
              <button
                onClick={handleGuardarPresupuesto}
                disabled={loading || cart.length === 0}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar Presupuesto"}
              </button>
            </div>
          </div>

        </div>
      )}

      {variationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-slate-950">Variaciones comerciales</h4>
                <p className="text-sm text-slate-500">Revise los cambios antes de convertir el presupuesto.</p>
              </div>
              <button onClick={() => setVariationReport(null)} aria-label="Cerrar"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {variationReport.lines?.map((line: any) => (
                <div key={line.detailId} className="rounded-lg border p-3">
                  <p className="font-semibold">{line.sku}</p>
                  {line.variations.map((variation: any) => (
                    <p key={variation.field} className="mt-1 text-sm text-slate-700">
                      {variation.field}: <span className="text-slate-500">{String(variation.previous)}</span> → <span className="font-medium">{String(variation.current)}</span>
                    </p>
                  ))}
                </div>
              ))}
              {variationReport.discountVariations?.map((variation: any) => (
                <p key={variation.field} className="rounded-lg border p-3 text-sm">DESCUENTO: {String(variation.previous)} → {String(variation.current)}</p>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-3 text-center text-sm">
              <div><span className="block text-slate-500">Anterior</span>{formatMoney(variationReport.previousTotal)}</div>
              <div><span className="block text-slate-500">Actual</span>{formatMoney(variationReport.currentTotal)}</div>
              <div><span className="block text-slate-500">Diferencia</span>{formatMoney(variationReport.totalDifference)}</div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={() => setVariationReport(null)} className="rounded border px-3 py-2 text-sm font-semibold">Cancelar conversión</button>
              <button onClick={() => setVariationReport(null)} className="rounded border px-3 py-2 text-sm font-semibold text-amber-700">Conservar valores</button>
              <button onClick={async () => { const result = await recalcularPresupuesto(variationReport.quotationId); if (result.error) alert(result.error); else { alert("Presupuesto recalculado."); setVariationReport(null); } }} className="rounded bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Recalcular</button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* MODAL DE RECIBO / PRESUPUESTO */}
      {showReceipt && createdPresupuesto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div id="presupuesto-pdf-area" className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border max-h-[90vh] print-content">
            
            <div className="bg-slate-950 p-4 text-white text-center flex flex-col items-center gap-2 relative">
              <FileText className="text-blue-400" size={36} />
              <div>
                <h4 className="font-bold text-lg">Presupuesto / Cotización</h4><p className="text-[10px] font-bold uppercase text-amber-600">Documento no fiscal</p>
                <p className="text-slate-400 text-xs">Nro: #PRES-{createdPresupuesto.id}</p>
              </div>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white no-print"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
              <div className="text-center space-y-1">
                <h5 className="font-bold text-sm">DISTRI PISOS</h5>
                <p className="text-slate-500">Validez: 15 días</p>
                <p className="text-slate-500">Fecha: {new Date(createdPresupuesto.fecha).toLocaleString("es-PY")}</p>
              </div>

              <div className="border-t border-b border-dashed py-2 space-y-1">
                <p><strong>Destinatario:</strong> {createdPresupuesto.cliente.nombre} {createdPresupuesto.cliente.apellido}</p>
                <p><strong>CI:</strong> {createdPresupuesto.cliente.documento}</p>
                {createdPresupuesto.cliente.ruc && <p><strong>RUC:</strong> {createdPresupuesto.cliente.ruc}</p>}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold border-b pb-1">
                  <span>Cant. / Detalle</span>
                  <span className="text-right">Total</span>
                </div>
                {createdPresupuesto.detalles.map((det: any) => (
                  <div key={det.id} className="flex justify-between items-start">
                    <div>
                      <div>{det.producto.codigo}</div>
                      <div className="text-slate-500">{det.producto.nombre}</div>
                      <div className="text-slate-400 text-[10px]">
                        {det.cantidad} {det.producto.unidadVenta} x {formatMoney(det.precioUnitario)}
                      </div>
                      {det.cantidadSolicitada != null && <div className="text-slate-500 text-[10px]">Solicitado: {det.cantidadSolicitada} · Presentaciones: {det.cantidadPresentacion} · Real: {det.cantidad}</div>}
                    </div>
                    <span className="text-right font-semibold">{formatMoney(det.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div className="border-t border-dashed pt-3 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatMoney(createdPresupuesto.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span>- {formatMoney(createdPresupuesto.descuento)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-double pt-1">
                  <span>Total Cotizado:</span>
                  <span>{formatMoney(createdPresupuesto.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex flex-col sm:flex-row gap-2 no-print">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>{downloading ? "Descargando..." : "Descargar PDF"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors text-xs font-semibold cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-slate-950 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
