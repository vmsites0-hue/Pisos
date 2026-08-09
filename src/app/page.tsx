import { getDashboardData } from "@/modules/dashboard/repositories/dashboard.repository";
import { Package, ShoppingCart, TrendingUp, Users, Store, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function DashboardPage() {
  await requireAuthenticatedUser();
  const {
    todaySales: ventasHoy,
    pendingOrders: pedidosPendientes,
    products: productos,
    newCustomers: nuevosClientesHoy,
    recentSales: ventasRecientes,
  } = await getDashboardData();

  const totalVentasHoy = ventasHoy.reduce((acc, curr) => acc + curr.total, 0);

  const productosBajoStock = productos.filter((prod) => {
    const stockConsolidado = prod.inventarios.reduce((sum, inv) => sum + inv.stockActual, 0);
    return stockConsolidado <= prod.stockMinimo;
  });

  const countBajoStock = productosBajoStock.length;

  // Formateador de moneda (Gs.)
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-slate-500">Resumen general de tu sucursal para el día de hoy.</p>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Ventas de Hoy" 
          value={formatMoney(totalVentasHoy)} 
          icon={<TrendingUp className="text-emerald-500" />} 
          trend={`${ventasHoy.length} transacciones`} 
        />
        <KpiCard 
          title="Pedidos por Entregar" 
          value={pedidosPendientes.toString()} 
          icon={<ShoppingCart className="text-blue-500" />} 
          trend="Pendientes en logística"
        />
        <KpiCard 
          title="Productos Bajo Stock" 
          value={countBajoStock.toString()} 
          icon={<Package className="text-amber-500" />} 
          trend="Requieren reposición"
        />
        <KpiCard 
          title="Nuevos Clientes" 
          value={nuevosClientesHoy.toString()} 
          icon={<Users className="text-purple-500" />} 
          trend="Registrados hoy"
        />
      </div>

      {/* Tablas de Información Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ventas Recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 flex flex-col justify-between shadow-sm min-h-[300px]">
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              <span>Ventas Recientes</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-medium">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Sucursal</th>
                    <th className="px-4 py-2">Método</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ventasRecientes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">
                        No hay ventas registradas aún.
                      </td>
                    </tr>
                  ) : (
                    ventasRecientes.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">#{v.id}</td>
                        <td className="px-4 py-3">{v.cliente.nombre} {v.cliente.apellido}</td>
                        <td className="px-4 py-3 text-slate-500">{v.sucursal.nombre}</td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 border font-bold text-[9px]">
                            {v.metodoPago}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatMoney(v.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {ventasRecientes.length > 0 && (
            <div className="pt-4 border-t text-right">
              <Link href="/ventas" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                Ir a Punto de Venta →
              </Link>
            </div>
          )}
        </div>

        {/* Stock Crítico */}
        <div className="bg-white rounded-xl border p-6 flex flex-col justify-between shadow-sm min-h-[300px]">
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <span>Stock Crítico</span>
            </h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {productosBajoStock.length === 0 ? (
                <div className="text-center text-slate-400 italic text-xs py-8">
                  Todo en orden. No hay productos bajo el stock mínimo.
                </div>
              ) : (
                productosBajoStock.map((prod) => {
                  const stockConsolidado = prod.inventarios.reduce((sum, inv) => sum + inv.stockActual, 0);
                  
                  return (
                    <div key={prod.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-slate-300 transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{prod.codigo}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[150px]" title={prod.nombre}>
                          {prod.nombre}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                        {stockConsolidado} {prod.unidadVenta}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {productosBajoStock.length > 0 && (
            <div className="pt-4 border-t text-right">
              <Link href="/inventario" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                Ir a Inventario →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {trend && <div className="text-[10px] text-slate-500 font-medium">{trend}</div>}
    </div>
  );
}
