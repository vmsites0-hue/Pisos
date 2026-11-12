"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Store, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Percent, 
  AlertTriangle,
  CheckCircle,
  Printer,
  X,
  Zap,
  Download
} from "lucide-react";
import { procesarVenta } from "@/modules/sales/actions/sales.actions";
import { calcularDescuentoAutomatico } from "@/modules/discounts/actions/discounts.actions";
import { availableStock, matchesCatalogQuery } from "@/modules/sales/domain/catalog-search";
import { cancelSaleAction } from "@/modules/returns/actions/sale-cancellations.actions";
import { registerReturnAction } from "@/modules/returns/actions/returns.actions";
import { simulateCredit } from "@/modules/credit/actions/credit-schedules.actions";
import { generateSaleTicketPDF } from "@/lib/pdf-generator";

interface VentasClientProps {
  products: any[];
  categories: any[];
  sucursales: any[];
  inventarios: any[];
  clientes: any[];
  creditPlans: any[];
}

export function VentasClient({ products, categories, sucursales, inventarios, clientes, creditPlans }: VentasClientProps) {
  // Selección de Sucursal activa para la venta
  const [sucursalId, setSucursalId] = useState<number>(0);
  
  // Cliente e ítems de venta
  const [clienteId, setClienteId] = useState<number>(0);
  const [cart, setCart] = useState<any[]>([]);
  const [descuento, setDescuento] = useState<number>(0);
  const [descuentoManual, setDescuentoManual] = useState<number>(0);
  const [descuentoAuto, setDescuentoAuto] = useState<number>(0);
  const [reglaAplicada, setReglaAplicada] = useState<string | null>(null);
  const [reglaAplicadaId, setReglaAplicadaId] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO");
  const [tipoEntrega, setTipoEntrega] = useState<string>("ENVIO");
  const [creditPlanId, setCreditPlanId] = useState<number>(creditPlans[0]?.id ?? 0);
  const [creditSimulation, setCreditSimulation] = useState<any>(null);
  const [approvalId, setApprovalId] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");

  // Filtros de búsqueda para catálogo
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Estado del proceso de venta
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal de Recibo/Ticket
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdVenta, setCreatedVenta] = useState<any>(null);
  const [cancellationMessage, setCancellationMessage] = useState<string | null>(null);
  const [returnMessage, setReturnMessage] = useState<string | null>(null);

  // Estado de descarga PDF
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!createdVenta) return;
    setDownloading(true);
    try {
      generateSaleTicketPDF(createdVenta);
    } catch (err) {
      console.error(err);
      setError("Error al generar el PDF del ticket.");
    } finally {
      setDownloading(false);
    }
  };

  // Inicializar sucursal por defecto
  useEffect(() => {
    if (sucursales.length > 0) {
      setSucursalId(sucursales[0].id);
    }
  }, [sucursales]);

  // Limpiar el carrito si cambia la sucursal
  useEffect(() => {
    setCart([]);
  }, [sucursalId]);

  // Evaluar descuento automático cuando cambia el carrito
  useEffect(() => {
    async function evalDescuento() {
      if (cart.length === 0) {
        setDescuentoAuto(0);
        setReglaAplicada(null);
        setReglaAplicadaId(null);
        setDescuento(descuentoManual);
        return;
      }
      const items = cart.map(item => ({
        productoId: item.productoId,
        categoriaId: products.find(p => p.id === item.productoId)?.categoriaId || 0,
        familiaId: products.find(p => p.id === item.productoId)?.familiaId,
        marcaId: products.find(p => p.id === item.productoId)?.marcaId,
        varianteId: item.varianteId,
        cantidad: item.cantidad,
        precioUnitario: item.precioVenta,
        subtotal: item.cantidad * item.precioVenta,
      }));
      const resultado = await calcularDescuentoAutomatico(items, clienteId || null);
      setDescuentoAuto(resultado.monto);
      setReglaAplicada(resultado.reglaAplicada);
      setReglaAplicadaId(resultado.reglaAplicadaId);
      setDescuento(resultado.monto + descuentoManual);
    }
    evalDescuento();
  }, [cart, descuentoManual, products, clienteId]);

  const selectedSucursal = sucursales.find(s => s.id === sucursalId);
  const selectedCliente = clientes.find(c => c.id === clienteId);

  // Obtener todos los inventarios disponibles en la sucursal seleccionada
  const availableInventarios = inventarios.filter(inv => inv.sucursalId === sucursalId && availableStock(inv.stockActual, inv.stockReservado) > 0);

  // Filtrar productos/lotes para mostrar en el catálogo
  const catalogItems = availableInventarios.filter(inv => {
    const matchesSearch = matchesCatalogQuery(inv, searchQuery);

    const matchesCategory = categoryFilter === "all" || inv.producto.categoriaId === parseInt(categoryFilter);

    return matchesSearch && matchesCategory;
  });

  // Agregar producto al carrito
  const addToCart = (inv: any) => {
    setError(null);
    const existingIndex = cart.findIndex(
      item => item.productoId === inv.productoId && item.varianteId === inv.varianteId && item.loteTono === inv.loteTono
    );

    const stockDisponible = inv.stockActual - inv.stockReservado;

    if (existingIndex > -1) {
      const newCart = [...cart];
      const nextQty = newCart[existingIndex].cantidad + 1;
      
      if (nextQty > stockDisponible) {
        setError(`No puedes agregar más de este lote. Stock neto disponible: ${stockDisponible}`);
        return;
      }

      newCart[existingIndex].cantidad = nextQty;
      // Calcular cajas si corresponde
      if (inv.producto.m2PorCaja && inv.producto.m2PorCaja > 0) {
        if (inv.producto.unidadVenta === "M2") {
          newCart[existingIndex].cajas = (nextQty / inv.producto.m2PorCaja).toFixed(3);
        } else if (inv.producto.unidadVenta === "CAJA") {
          newCart[existingIndex].cajas = nextQty.toString();
        }
      }
      setCart(newCart);
    } else {
      let initialCajas = "";
      if (inv.producto.m2PorCaja && inv.producto.m2PorCaja > 0) {
        if (inv.producto.unidadVenta === "M2") {
          initialCajas = (1 / inv.producto.m2PorCaja).toFixed(3);
        } else if (inv.producto.unidadVenta === "CAJA") {
          initialCajas = "1";
        }
      }

      setCart([
        ...cart,
        {
          productoId: inv.productoId,
          varianteId: inv.varianteId,
          codigo: inv.producto.codigo,
          nombre: inv.producto.nombre,
          loteTono: inv.loteTono,
          unidadVenta: inv.producto.unidadVenta,
          m2PorCaja: inv.producto.m2PorCaja,
          precioVenta: inv.producto.precioVenta,
          precioOriginal: inv.producto.precioVenta,
          stockActual: inv.stockActual,
          stockReservado: inv.stockReservado,
          categoriaId: inv.producto.categoriaId,
          cantidad: 1, // Por defecto 1
          cajas: initialCajas,
        }
      ]);
    }
  };

  // Actualizar cantidad en carrito
  const updateQty = (index: number, newQty: number) => {
    setError(null);
    const item = cart[index];
    const stockDisponible = item.stockActual - (item.stockReservado || 0);
    
    if (newQty <= 0) {
      removeCartItem(index);
      return;
    }

    if (newQty > stockDisponible) {
      setError(`Stock insuficiente. Disponible neto: ${stockDisponible} ${item.unidadVenta}`);
      return;
    }

    const newCart = [...cart];
    newCart[index].cantidad = newQty;
    
    // Recalcular cajas
    if (item.m2PorCaja && item.m2PorCaja > 0) {
      if (item.unidadVenta === "M2") {
        newCart[index].cajas = (newQty / item.m2PorCaja).toFixed(3);
      } else if (item.unidadVenta === "CAJA") {
        newCart[index].cajas = newQty.toString();
      }
    }
    setCart(newCart);
  };

  // Manejar cambio en caja input
  const handleCartCajasChange = (index: number, valStr: string) => {
    setError(null);
    const item = cart[index];
    const val = parseFloat(valStr);
    const stockDisponible = item.stockActual - (item.stockReservado || 0);

    const newCart = [...cart];
    newCart[index].cajas = valStr;

    if (!isNaN(val) && item.m2PorCaja) {
      let calculatedQty = val;
      if (item.unidadVenta === "M2") {
        calculatedQty = val * item.m2PorCaja;
      }
      
      if (calculatedQty > stockDisponible) {
        setError(`Supera el stock disponible neto. Máximo en cajas: ${(stockDisponible / item.m2PorCaja).toFixed(2)}`);
        return;
      }
      
      newCart[index].cantidad = parseFloat(calculatedQty.toFixed(3));
    }
    setCart(newCart);
  };

  // Manejar cambio en m2 input
  const handleCartM2Change = (index: number, valStr: string) => {
    setError(null);
    const item = cart[index];
    const val = parseFloat(valStr);
    const stockDisponible = item.stockActual - (item.stockReservado || 0);

    const newCart = [...cart];
    newCart[index].cantidad = isNaN(val) ? 0 : val;

    if (!isNaN(val) && item.m2PorCaja) {
      if (val > stockDisponible) {
        setError(`Supera el stock disponible neto. Máximo: ${stockDisponible} m²`);
        return;
      }
      newCart[index].cajas = (val / item.m2PorCaja).toFixed(3);
    }
    setCart(newCart);
  };

  // Remover item del carrito
  const removeCartItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Cálculos de totales
  const subtotal = cart.reduce((acc, curr) => acc + (curr.cantidad * curr.precioVenta), 0);
  const total = Math.max(0, subtotal - descuento);

  // Validaciones del límite de crédito
  const limiteCreditoCliente = selectedCliente?.limiteCredito || 0;
  const saldoDeudorCliente = selectedCliente?.saldoDeudor || 0;
  const creditoDisponible = Math.max(0, limiteCreditoCliente - saldoDeudorCliente);
  const creditoExcedido = metodoPago === "CREDITO" && (saldoDeudorCliente + total > limiteCreditoCliente);

  // Formateador de moneda (Gs.)
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
  };

  // Procesar Venta
  async function handleConfirmarVenta() {
    if (cart.length === 0) return;
    if (!sucursalId) return;

    if (metodoPago === "CREDITO" && (!clienteId || clienteId === 0)) {
      setError("Para ventas a crédito es obligatorio seleccionar un cliente registrado con línea de crédito.");
      return;
    }

    if (creditoExcedido) {
      setError("No se puede confirmar la venta: El cliente excede su límite de crédito.");
      return;
    }

    setLoading(true);
    setError(null);

    const inputData = {
      sucursalId,
      clienteId: clienteId > 0 ? clienteId : null,
      descuento,
      reglaDescuentoId: reglaAplicadaId,
      descuentoAutomatico: descuentoAuto,
      approvalId: approvalId ? Number(approvalId) : null,
      exceptionReason,
      creditPlanId: metodoPago === "CREDITO" ? creditPlanId : null,
      metodoPago,
      tipoEntrega,
      detalles: cart.map(item => ({
        productoId: item.productoId,
        varianteId: item.varianteId,
        loteTono: item.loteTono,
        cantidad: item.cantidad,
        precioUnitario: item.precioVenta
      }))
    };

    const res = await procesarVenta(inputData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.venta) {
      setCreatedVenta(res.venta);
      setCart([]);
      setDescuento(0);
      setDescuentoManual(0);
      setDescuentoAuto(0);
      setReglaAplicada(null);
      setShowReceipt(true);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-8rem)] no-print">
      
      {/* PANEL IZQUIERDO: Catálogo y Búsqueda (cols: 7) */}
      <div className="lg:col-span-7 space-y-6 flex flex-col">
        {/* Filtros de Sucursal y Catálogo */}
        <div className="bg-white p-4 rounded-xl border space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Store className="text-slate-500" size={20} />
              <span>Sucursal Origen</span>
            </h3>
            <span className="rounded-md border bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
              {selectedSucursal?.nombre ?? "Local principal"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por código, nombre o lote..."
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
        </div>

        {/* Listado de Productos Disponibles en Stock */}
        <div className="bg-white rounded-xl border flex-1 overflow-y-auto max-h-[500px] min-h-[300px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium sticky top-0">
              <tr>
                <th className="px-4 py-3">Código / Producto</th>
                <th className="px-4 py-3">Lote / Tono</th>
                <th className="px-4 py-3 text-right">Disponible</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {catalogItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No hay productos en stock para los filtros seleccionados en {selectedSucursal?.nombre || "la sucursal"}.
                  </td>
                </tr>
              ) : (
                catalogItems.map((inv) => {
                  const m2PorCajaVal = inv.producto.m2PorCaja;
                  const isM2 = inv.producto.unidadVenta === "M2";
                  const stockDisponible = inv.stockActual - inv.stockReservado;
                  let stockEnCajas = "";
                  if (m2PorCajaVal && m2PorCajaVal > 0) {
                    if (isM2) {
                      stockEnCajas = `(${(stockDisponible / m2PorCajaVal).toFixed(1)} cj)`;
                    } else if (inv.producto.unidadVenta === "CAJA") {
                      stockEnCajas = `(${stockDisponible} cj)`;
                    }
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {inv.producto.imagenUrl ? (
                            <img 
                              src={inv.producto.imagenUrl} 
                              alt={inv.producto.nombre} 
                              className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <ShoppingCart size={12} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{inv.producto.codigo}</div>
                            <div className="text-slate-500 font-medium text-[10px] sm:text-xs truncate max-w-[150px]">{inv.producto.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {inv.loteTono ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border text-[10px] font-bold text-slate-700 uppercase">
                            {inv.loteTono}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Sin lote</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium">
                        <div className="font-semibold text-slate-900">{stockDisponible} {inv.producto.unidadVenta}</div>
                        <div className="text-[10px] text-slate-400">{stockEnCajas}</div>
                        <div className="text-[9px] text-slate-500">{inv.variante?.presentaciones?.map((presentation: any) => `${presentation.nombre} (${presentation.factorConversion} ${presentation.unidad.simbolo})`).join(" · ")}</div>
                        {inv.stockReservado > 0 && (
                          <div className="text-[9px] text-amber-600 font-semibold">Res: {inv.stockReservado}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-950">
                        {formatMoney(inv.producto.precioVenta)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => addToCart(inv)}
                          className="bg-slate-900 hover:bg-slate-800 text-white p-1 rounded transition-colors cursor-pointer"
                          title="Añadir al carrito"
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL DERECHO: Facturación y Carrito (cols: 5) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-xl border flex flex-col justify-between space-y-4">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="text-slate-700" size={20} />
              <span>Carrito de Compras</span>
            </h3>
            <span className="px-2 py-0.5 bg-slate-100 border text-xs font-semibold rounded-full text-slate-600">
              {cart.length} ítems
            </span>
          </div>

          {/* Selector de Cliente */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1">
                <User size={12} />
                <span>Cliente Facturación</span>
              </label>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional al contado)</span>
            </div>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(parseInt(e.target.value) || 0)}
              className="w-full border rounded-md p-2 text-sm bg-white outline-none focus:border-slate-400 font-semibold text-slate-800"
            >
              <option value="0">👤 Consumidor Final / Cliente Ocasional (Sin registrar)</option>
              {clientes.filter(c => c.documento !== "0").map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido} (CI: {c.documento})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-start gap-1.5">
              <AlertTriangle className="shrink-0" size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Listado de items del carrito */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]">
            {cart.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-sm italic">
                El carrito está vacío. Agrega productos del catálogo.
              </div>
            ) : (
              cart.map((item, index) => {
                const isTile = item.m2PorCaja && item.m2PorCaja > 0;
                
                return (
                  <div key={`${item.productoId}-${item.loteTono}`} className="p-3 border rounded-lg hover:border-slate-300 transition-colors space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{item.codigo}</div>
                        <div className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{item.nombre}</div>
                        {item.loteTono && (
                          <span className="inline-block text-[9px] bg-slate-100 border font-bold text-slate-600 px-1 rounded uppercase mt-0.5">
                            Lote: {item.loteTono}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <input aria-label={`Precio de ${item.nombre}`} type="number" min="0" value={item.precioVenta} onChange={(event) => setCart(cart.map((entry, entryIndex) => entryIndex === index ? { ...entry, precioVenta: Number(event.target.value) } : entry))} className="w-28 rounded border px-1 text-right text-xs font-bold" />
                        <div className="text-[10px] text-slate-400">Total: {formatMoney(item.cantidad * item.precioVenta)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      {isTile ? (
                        /* Caja y M2 inputs duales */
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
                        /* Control de cantidad común */
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
                          <span className="text-[10px] text-slate-400 font-medium">Unidades</span>
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

        {/* Resumen Financiero y Pago */}
        <div className="space-y-4 pt-4 border-t">
          {/* Descuento Manual, Método de Pago y Tipo de Entrega */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Percent size={10} />
                <span>Descuento Manual (Gs.)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={descuentoManual}
                onChange={(e) => setDescuentoManual(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full border rounded-md p-1.5 text-xs bg-white outline-none focus:border-slate-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CreditCard size={10} />
                <span>Método de Pago</span>
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border rounded-md p-1.5 text-xs bg-white outline-none focus:border-slate-400 font-semibold"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta Débito/Crédito</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="CREDITO">Crédito (A Cuenta)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Store size={10} />
                <span>Modalidad de Entrega</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoEntrega("ENVIO")}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold border transition-all cursor-pointer text-center ${
                    tipoEntrega === "ENVIO"
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Envío a Domicilio (Logística)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEntrega("RETIRO")}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold border transition-all cursor-pointer text-center ${
                    tipoEntrega === "RETIRO"
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Retiro en Local (Inmediato)
                </button>
              </div>
            </div>
            {(descuentoManual > 0 || cart.some((item) => item.precioOriginal && item.precioOriginal !== item.precioVenta)) && <div className="col-span-2 grid grid-cols-2 gap-2 rounded border bg-amber-50 p-2"><input value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} placeholder="Motivo de la excepción" className="rounded border p-1.5 text-xs" /><input value={approvalId} onChange={(event) => setApprovalId(event.target.value)} type="number" min="1" placeholder="ID aprobación (si corresponde)" className="rounded border p-1.5 text-xs" /></div>}
          </div>

          {/* Descuento Automático Aplicado */}
          {descuentoAuto > 0 && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <Zap size={14} className="text-emerald-600 animate-bounce" />
                <span>Descuento Automático Aplicado:</span>
              </div>
              <span className="font-bold text-emerald-700">
                -{formatMoney(descuentoAuto)} <span className="text-[9px] font-normal text-slate-500">({reglaAplicada})</span>
              </span>
            </div>
          )}

          {/* Info Cuenta Corriente si es Crédito */}
          {metodoPago === "CREDITO" && selectedCliente && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span>Límite de Crédito:</span>
                <span className="font-semibold">{formatMoney(limiteCreditoCliente)}</span>
              </div>
              <div className="flex justify-between">
                <span>Deuda actual:</span>
                <span className="font-semibold text-red-600">{formatMoney(saldoDeudorCliente)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-1 font-bold">
                <span>Disponible para compras:</span>
                <span className={creditoExcedido ? "text-red-600" : "text-emerald-700"}>
                  {formatMoney(creditoDisponible)}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-1 border-t border-blue-200 pt-2"><select value={creditPlanId} onChange={(event) => { setCreditPlanId(Number(event.target.value)); setCreditSimulation(null); }} className="rounded border bg-white p-1 text-xs">{creditPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.nombre} · {plan.sistema} · {plan.numeroCuotas} cuotas</option>)}</select><button type="button" onClick={async () => setCreditSimulation(await simulateCredit({ planId: creditPlanId, principal: total }))} className="rounded bg-blue-900 px-2 text-white">Simular</button></div>
              {creditSimulation?.error && <p className="text-red-700">{creditSimulation.error}</p>}
              {creditSimulation?.installments && <div className="max-h-28 overflow-auto rounded bg-white p-1"><p className="font-semibold">Interés: {formatMoney(creditSimulation.totalInterest)} · Total: {formatMoney(creditSimulation.total)}</p>{creditSimulation.installments.map((installment: any) => <p key={installment.number}>#{installment.number} {new Date(installment.dueDate).toLocaleDateString("es-PY")} · capital {formatMoney(installment.capital)} · interés {formatMoney(installment.interest)} · cuota {formatMoney(installment.payment)} · saldo {formatMoney(installment.balance)}</p>)}</div>}
              {creditoExcedido && (
                <div className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>El total de la venta supera el crédito disponible.</span>
                </div>
              )}
            </div>
          )}

          {/* Totales */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal:</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {descuentoManual > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Descuento Manual:</span>
                <span>- {formatMoney(descuentoManual)}</span>
              </div>
            )}
            {descuentoAuto > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Descuento Automático:</span>
                <span>- {formatMoney(descuentoAuto)}</span>
              </div>
            )}
            {(descuentoManual > 0 || descuentoAuto > 0) && (
              <div className="flex justify-between text-xs font-semibold text-slate-700 border-t pt-1 border-slate-200">
                <span>Total Descuentos:</span>
                <span>- {formatMoney(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t pt-1.5 text-slate-900 border-slate-300">
              <span>Total a Pagar:</span>
              <span className="text-lg text-slate-950">{formatMoney(total)}</span>
            </div>
          </div>

          {/* Botón de envío */}
          <button
            onClick={handleConfirmarVenta}
            disabled={loading || cart.length === 0 || creditoExcedido}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            {loading ? "Procesando..." : "Confirmar y Facturar Venta"}
          </button>
        </div>
      </div>

      {/* MODAL DE RECIBO / TICKET EXITOSO */}
      {showReceipt && createdVenta && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div id="venta-pdf-area" className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border max-h-[90vh] print-content">
            
            {/* Cabezal de Éxito */}
            <div className="bg-slate-900 p-4 text-white text-center flex flex-col items-center gap-2 relative">
              <CheckCircle className="text-emerald-400" size={40} />
              <div>
                <h4 className="font-bold text-lg">Venta Exitosa</h4>
                <p className="text-slate-400 text-xs">Venta #{createdVenta.id}</p>
              </div>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white no-print"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Recibo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
              <div className="text-center space-y-1">
                <h5 className="font-bold text-sm">DISTRI PISOS</h5>
                <p className="font-bold uppercase tracking-wide">Comprobante interno no fiscal</p>
                <p className="text-slate-500">Sucursal: {createdVenta.sucursal.nombre}</p>
                <p className="text-slate-500">Fecha: {new Date(createdVenta.fecha).toLocaleString("es-PY")}</p>
              </div>

              <div className="border-t border-b border-dashed py-2 space-y-1">
                <p><strong>Cliente:</strong> {createdVenta.cliente.nombre} {createdVenta.cliente.apellido}</p>
                <p><strong>CI:</strong> {createdVenta.cliente.documento}</p>
                {createdVenta.cliente.ruc && <p><strong>RUC:</strong> {createdVenta.cliente.ruc}</p>}
                <p><strong>Método de Pago:</strong> {createdVenta.metodoPago}</p>
                <p><strong>Modalidad:</strong> {createdVenta.tipoEntrega === "RETIRO" ? "RETIRO EN LOCAL" : "ENVÍO A DOMICILIO"}</p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold border-b pb-1">
                  <span>Cant. / Detalle</span>
                  <span className="text-right">Total</span>
                </div>
                {createdVenta.detalles.map((det: any) => (
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
                  <span>{formatMoney(createdVenta.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span>- {formatMoney(createdVenta.descuento)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto incluido:</span>
                  <span>{formatMoney(createdVenta.detalles.reduce((sum: number, detail: any) => sum + (detail.impuesto || 0), 0))}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-double pt-1">
                  <span>Total de la venta:</span>
                  <span>{formatMoney(createdVenta.total)}</span>
                </div>
              </div>

              {createdVenta.estado !== "CANCELADA" && <details className="no-print rounded border p-2 font-sans"><summary className="cursor-pointer text-xs font-semibold">Registrar devolución</summary><form action={async (formData) => { const result = await registerReturnAction(formData); setReturnMessage(result.success ? "Devolución registrada." : `${result.error}${result.approvalRequestId ? ` Solicitud #${result.approvalRequestId}.` : ""}`); }} className="mt-2 grid grid-cols-2 gap-1"><input type="hidden" name="saleId" value={createdVenta.id} /><select required name="saleDetailId" className="rounded border p-1 text-xs">{createdVenta.detalles.map((detail: any) => <option key={detail.id} value={detail.id}>{detail.producto.nombre}</option>)}</select><input required name="quantity" type="number" min="0.001" step="0.001" placeholder="Cantidad" className="rounded border p-1 text-xs" /><select name="condition" className="rounded border p-1 text-xs"><option value="APTO">Apto: vuelve a stock</option><option value="DEFECTUOSO">Defectuoso: pérdida</option><option value="CUARENTENA">Cuarentena</option></select><input required name="reason" placeholder="Motivo" className="rounded border p-1 text-xs" /><input name="evidenceUrl" placeholder="URL evidencia (opcional)" className="rounded border p-1 text-xs" /><input name="approvalId" type="number" min="1" placeholder="ID aprobación" className="rounded border p-1 text-xs" /><button className="col-span-2 rounded bg-slate-900 p-1 text-xs text-white">Solicitar/registrar devolución</button>{returnMessage && <p className="col-span-2 text-xs text-slate-600">{returnMessage}</p>}</form></details>}

            </div>

            {/* Botones de acción del recibo */}
            <div className="p-4 border-t bg-slate-50 flex flex-col sm:flex-row gap-2 no-print">
              {createdVenta.estado !== "ENTREGADO" && createdVenta.estado !== "CANCELADA" && <form action={async (formData) => { const result = await cancelSaleAction(formData); if (result.success) { setCreatedVenta({ ...createdVenta, estado: "CANCELADA" }); setCancellationMessage("Venta cancelada y stock revertido."); } else setCancellationMessage(`${result.error}${result.approvalRequestId ? ` Solicitud #${result.approvalRequestId}.` : ""}`); }} className="w-full space-y-1 rounded border bg-white p-2"><input type="hidden" name="saleId" value={createdVenta.id} /><div className="grid grid-cols-2 gap-1"><input required name="reason" placeholder="Motivo de cancelación" className="rounded border p-1 text-xs" /><input name="approvalId" type="number" min="1" placeholder="ID aprobación" className="rounded border p-1 text-xs" /></div><button className="w-full rounded border p-1 text-xs font-semibold text-red-700">Solicitar/ejecutar cancelación</button>{cancellationMessage && <p className="text-xs text-slate-600">{cancellationMessage}</p>}</form>}
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
                className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer text-center"
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
