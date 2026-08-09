"use client";

import { useState } from "react";
import { 
  PackagePlus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Layers, 
  Store, 
  TrendingDown, 
  Plus, 
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import { ProductForm } from "./ProductForm";
import { CategoryForm } from "./CategoryForm";
import { StockForm } from "./StockForm";
import { deleteProducto } from "@/modules/inventory/actions/products.actions";

interface InventarioClientProps {
  products: any[];
  categories: any[];
  sucursales: any[];
  inventarios: any[];
}

export function InventarioClient({ products, categories, sucursales, inventarios }: InventarioClientProps) {
  const [activeTab, setActiveTab] = useState<"catalogo" | "stock">("catalogo");
  
  // Filtros y búsquedas
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sucursalFilter, setSucursalFilter] = useState("all");

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [preselectedProductId, setPreselectedProductId] = useState<number | null>(null);

  // Mensajes de error/éxito
  const [error, setError] = useState<string | null>(null);

  // Calcular stock consolidado para cada producto
  const getProductConsolidatedStock = (productId: number) => {
    return inventarios
      .filter((inv) => inv.productoId === productId)
      .reduce((acc, curr) => acc + curr.stockActual, 0);
  };

  // Filtrar productos
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = 
      prod.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
      prod.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.marca && prod.marca.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || prod.categoriaId === parseInt(categoryFilter);

    return matchesSearch && matchesCategory;
  });

  // Filtrar detalles de stock
  const filteredInventarios = inventarios.filter((inv) => {
    const matchesSearch = 
      inv.producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.producto.codigo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = sucursalFilter === "all" || inv.sucursalId === parseInt(sucursalFilter);

    return matchesSearch && matchesBranch;
  });

  // Eliminar Producto
  async function handleDeleteProduct(id: number, name: string) {
    if (!confirm(`¿Estás seguro de eliminar el producto "${name}"?\nEsta acción no se puede deshacer.`)) return;
    
    setError(null);
    const res = await deleteProducto(id);
    if (res.error) {
      setError(res.error);
      alert(res.error); // Alerta flotante rápida para no arruinar la vista
    }
  }

  // Abrir modal de creación
  const handleNewProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  // Abrir modal de edición
  const handleEditProduct = (prod: any) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  // Abrir modal de ajuste de stock
  const handleAdjustStock = (productId?: number) => {
    setPreselectedProductId(productId || null);
    setIsStockModalOpen(true);
  };

  // Formateador de moneda (Gs.)
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo e Inventario</h2>
          <p className="text-slate-500">Administra tus productos, precios y niveles de stock.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Botón Gestión de Categorías */}
          <CategoryForm categories={categories} />

          {/* Botón Ajustar Stock */}
          <button
            onClick={() => handleAdjustStock()}
            className="bg-white border text-slate-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer text-sm font-medium"
          >
            <Plus size={18} />
            <span>Ajustar Stock</span>
          </button>

          {/* Botón Nuevo Producto */}
          <button 
            onClick={handleNewProduct}
            className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer text-sm font-medium"
          >
            <PackagePlus size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas (Tabs) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("catalogo"); setSearchQuery(""); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "catalogo"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Catálogo ({products.length})
        </button>
        <button
          onClick={() => { setActiveTab("stock"); setSearchQuery(""); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "stock"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Stock por Sucursal / Lote
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-xl border flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === "catalogo" ? "Buscar por nombre, código o marca..." : "Buscar producto..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>

        {activeTab === "catalogo" ? (
          /* Filtro de Categoría */
          <div className="flex items-center gap-2 bg-slate-50 border rounded-md px-3 py-1.5">
            <Filter size={16} className="text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-sm border-none outline-none text-slate-700 bg-white"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-50 border rounded-md px-3 py-1.5 text-sm text-slate-700">
            <Store size={16} className="text-slate-400" />
            <span>{sucursales[0]?.nombre ?? "Local principal"}</span>
          </div>
        )}
      </div>

      {/* Contenido de la pestaña: CATÁLOGO */}
      {activeTab === "catalogo" && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Código / Nombre</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Precio Compra</th>
                <th className="px-6 py-4 text-right">Precio Venta</th>
                <th className="px-6 py-4 text-center">Stock Total</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron productos en el catálogo.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const stockTotal = getProductConsolidatedStock(prod.id);
                  const isLowStock = stockTotal <= prod.stockMinimo;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      {/* Código y Nombre */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Miniatura de imagen */}
                          {prod.imagenUrl ? (
                            <img 
                              src={prod.imagenUrl} 
                              alt={prod.nombre} 
                              className="w-10 h-10 rounded-md object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <PackagePlus size={16} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{prod.codigo}</div>
                            <div className="text-slate-500 font-medium text-xs sm:text-sm">{prod.nombre}</div>
                            {prod.marca && <span className="inline-block mt-1 text-[10px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{prod.marca}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-600 border">
                          {prod.categoria.nombre}
                        </span>
                      </td>

                      {/* Precios */}
                      <td className="px-6 py-4 text-right text-slate-600 font-medium">
                        {formatMoney(prod.precioCompra)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {formatMoney(prod.precioVenta)}
                      </td>

                      {/* Stock Consolidado */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isLowStock 
                              ? "bg-red-50 text-red-700 border border-red-200" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {stockTotal} {prod.unidadVenta}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5" title={`Stock mínimo configurado: ${prod.stockMinimo}`}>
                              <AlertTriangle size={10} /> Stock Crítico
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right space-x-1">
                        <button 
                          onClick={() => handleAdjustStock(prod.id)}
                          className="px-2 py-1 text-xs border rounded bg-white text-slate-600 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                          title="Ajustar Stock"
                        >
                          Stock
                        </button>
                        <button 
                          onClick={() => handleEditProduct(prod)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors inline-block cursor-pointer" 
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
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

      {/* Contenido de la pestaña: STOCK DETALLADO */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Sucursal / Depósito</th>
                <th className="px-6 py-4">Lote / Tono</th>
                <th className="px-6 py-4 text-right">Existencia Física</th>
                <th className="px-6 py-4 text-right">Reservado</th>
                <th className="px-6 py-4 text-right">Física en Cajas</th>
                <th className="px-6 py-4 text-right">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInventarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No hay registros de inventario asignados a sucursales.
                  </td>
                </tr>
              ) : (
                filteredInventarios.map((inv) => {
                  const m2PorCajaVal = inv.producto.m2PorCaja;
                  const isM2 = inv.producto.unidadVenta === "M2";
                  
                  // Calcular cajas equivalentes
                  let cajasEquiv = "-";
                  if (m2PorCajaVal && m2PorCajaVal > 0) {
                    if (isM2) {
                      cajasEquiv = (inv.stockActual / m2PorCajaVal).toFixed(2) + " cj";
                    } else if (inv.producto.unidadVenta === "CAJA") {
                      cajasEquiv = inv.stockActual + " cj";
                    }
                  }

                  const stockDisponible = inv.stockActual - inv.stockReservado;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      {/* Producto */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{inv.producto.codigo}</div>
                        <div className="text-slate-500 text-xs">{inv.producto.nombre}</div>
                      </td>

                      {/* Sucursal */}
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Store size={14} className="text-slate-400" />
                          <span>{inv.sucursal.nombre}</span>
                        </div>
                      </td>

                      {/* Lote / Tono */}
                      <td className="px-6 py-4">
                        {inv.loteTono ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border text-xs font-bold uppercase text-slate-700">
                            {inv.loteTono}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Sin especificar</span>
                        )}
                      </td>

                      {/* Existencia Física */}
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {inv.stockActual} {inv.producto.unidadVenta}
                      </td>

                      {/* Reservado */}
                      <td className="px-6 py-4 text-right">
                        {inv.stockReservado > 0 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {inv.stockReservado} {inv.producto.unidadVenta}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0</span>
                        )}
                      </td>

                      {/* Equivalente en Cajas */}
                      <td className="px-6 py-4 text-right text-slate-500">
                        {cajasEquiv}
                      </td>

                      {/* Disponible */}
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          stockDisponible <= 0 ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {stockDisponible} {inv.producto.unidadVenta}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Producto */}
      <ProductForm 
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        categories={categories}
      />

      {/* Modal de Ajuste de Stock */}
      <StockForm
        isOpen={isStockModalOpen}
        onClose={() => { setIsStockModalOpen(false); setPreselectedProductId(null); }}
        products={products}
        sucursales={sucursales}
        preselectedProductId={preselectedProductId}
      />
    </div>
  );
}
