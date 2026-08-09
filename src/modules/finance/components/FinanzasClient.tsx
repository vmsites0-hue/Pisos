"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  CreditCard, 
  DollarSign, 
  Plus, 
  X, 
  PiggyBank, 
  Wallet,
  Trash2,
  TrendingDown,
  Calculator,
  ArrowRight
} from "lucide-react";
import { registrarPagoCliente } from "@/modules/finance/actions/payments.actions";
import { registrarGasto, eliminarGasto } from "@/modules/finance/actions/expenses.actions";
import { registerInstallmentPayment } from "@/modules/credit/actions/installment-payments.actions";

interface FinanzasClientProps {
  sales: any[];
  debtorClients: any[];
  gastos: any[];
  credits: any[];
  movements: any[];
}

export function FinanzasClient({ sales, debtorClients, gastos, credits, movements }: FinanzasClientProps) {
  // Modal de cobro de clientes
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [cobroError, setCobroError] = useState<string | null>(null);
  const [cobroLoading, setCobroLoading] = useState(false);
  const [installmentMessage, setInstallmentMessage] = useState<string | null>(null);

  // Modal de registro de gastos
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [gastoError, setGastoError] = useState<string | null>(null);
  const [gastoLoading, setGastoLoading] = useState(false);

  // Totales de recaudación por método de pago
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);
  const totalEfectivo = sales.filter(s => s.metodoPago === "EFECTIVO").reduce((acc, curr) => acc + curr.total, 0);
  const totalTarjeta = sales.filter(s => s.metodoPago === "TARJETA").reduce((acc, curr) => acc + curr.total, 0);
  const totalTransferencia = sales.filter(s => s.metodoPago === "TRANSFERENCIA").reduce((acc, curr) => acc + curr.total, 0);
  
  // Total en deudas actuales (Cuentas por Cobrar)
  const totalCuentasPorCobrar = debtorClients.reduce((acc, curr) => acc + curr.saldoDeudor, 0);

  // Total de gastos registrados
  const totalGastos = gastos.filter((expense) => expense.estado !== "ANULADO").reduce((acc, curr) => acc + curr.monto, 0);

  // Saldo Neto Diario / Balance General
  const saldoNeto = totalRevenue - totalGastos;

  // Formateador de moneda (Gs.)
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
  };

  // Manejar abono de cobro cliente
  async function handleRegistrarCobro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedClient) return;

    setCobroLoading(true);
    setCobroError(null);

    const formData = new FormData(e.currentTarget);
    const monto = parseFloat(formData.get("monto") as string);

    if (monto > selectedClient.saldoDeudor) {
      setCobroError(`El monto del cobro (${formatMoney(monto)}) no puede superar el saldo deudor actual (${formatMoney(selectedClient.saldoDeudor)}).`);
      setCobroLoading(false);
      return;
    }

    const res = await registrarPagoCliente(selectedClient.id, monto);
    setCobroLoading(false);

    if (res.error) {
      setCobroError(res.error);
    } else {
      setIsCobroModalOpen(false);
      setSelectedClient(null);
    }
  }

  // Manejar creación de gasto
  async function handleRegistrarGasto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGastoLoading(true);
    setGastoError(null);

    const formData = new FormData(e.currentTarget);
    const res = await registrarGasto(formData);
    setGastoLoading(false);

    if (res.error) {
      setGastoError(res.error);
    } else {
      setIsGastoModalOpen(false);
    }
  }

  // Anular un gasto conservando su trazabilidad
  async function handleDeleteGasto(id: number, desc: string) {
    const motivo = prompt(`Motivo para anular el gasto "${desc}":`);
    if (!motivo) return;
    const approvalText = prompt("ID de aprobación autorizada (vacío para crear la solicitud):");
    const res = await eliminarGasto(id, motivo, approvalText ? Number(approvalText) : undefined);
    if (res.error) {
      alert(res.error);
    } else if (res.approvalRequired) {
      alert(`Solicitud #${res.approvalRequestId} creada. Tras aprobarla, repetí la anulación indicando ese ID.`);
    }
  }

  const handleOpenCobroModal = (cli: any) => {
    setSelectedClient(cli);
    setCobroError(null);
    setIsCobroModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finanzas y Caja del Día</h2>
          <p className="text-slate-500">Corte de caja diario: ventas, gastos y balance neto de hoy.</p>
        </div>
        <button
          onClick={() => { setGastoError(null); setIsGastoModalOpen(true); }}
          className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer text-sm font-medium"
        >
          <Plus size={18} />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Widgets de Flujo de Caja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Recaudación Total Ventas */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col gap-1.5 shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ventas Hoy</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-lg font-bold">{formatMoney(totalRevenue)}</div>
          <div className="text-[9px] text-slate-400">Facturado en el día de hoy</div>
        </div>

        {/* Total Gastos */}
        <div className="bg-white p-4 rounded-xl border flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gastos Hoy</span>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <div className="text-lg font-bold text-red-600">{formatMoney(totalGastos)}</div>
          <div className="text-[9px] text-slate-400">Egresos registrados hoy</div>
        </div>

        {/* Saldo Neto */}
        <div className={`p-4 rounded-xl border flex flex-col gap-1.5 shadow-sm ${
          saldoNeto >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Balance Neto Hoy</span>
            <Calculator size={16} className={saldoNeto >= 0 ? "text-emerald-600" : "text-red-600"} />
          </div>
          <div className={`text-lg font-bold ${saldoNeto >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {formatMoney(saldoNeto)}
          </div>
          <div className="text-[9px] text-slate-500">Recaudación menos Gastos</div>
        </div>

        {/* Caja Efectivo */}
        <div className="bg-white p-4 rounded-xl border flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Caja Efectivo</span>
            <Wallet size={16} className="text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900">{formatMoney(totalEfectivo)}</div>
          <div className="text-[9px] text-slate-400">Tarjeta: {formatMoney(totalTarjeta)}</div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white p-4 rounded-xl border flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cuentas por Cobrar</span>
            <PiggyBank size={16} className="text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-950">{formatMoney(totalCuentasPorCobrar)}</div>
          <div className="text-[9px] text-slate-400">Saldos pendientes a cobrar</div>
        </div>
      </div>

      {/* Sección en 2 columnas: Deudores y Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cartera de Deudores (Créditos) */}
        <div className="bg-white rounded-xl border p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b mb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <PiggyBank className="text-slate-500" size={18} />
                <span>Cartera de Deudores (Crédito Cuenta Corriente)</span>
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-medium sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2 text-right">Deuda</th>
                    <th className="px-3 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {debtorClients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-8 text-center text-slate-400 italic">
                        No hay clientes deudores.
                      </td>
                    </tr>
                  ) : (
                    debtorClients.map((cli) => (
                      <tr key={cli.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {cli.nombre} {cli.apellido}
                          <div className="text-[10px] text-slate-500 font-normal">CI: {cli.documento}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-red-600">
                          {formatMoney(cli.saldoDeudor)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleOpenCobroModal(cli)}
                            className="bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Historial de Gastos del Día */}
        <div className="bg-white rounded-xl border p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b mb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingDown className="text-red-500" size={18} />
                <span>Historial de Gastos Diarios</span>
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-slate-600 font-medium sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {gastos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-slate-400 italic">
                        No hay gastos registrados hoy.
                      </td>
                    </tr>
                  ) : (
                    gastos.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 text-slate-500">
                          {new Date(g.fecha).toLocaleDateString("es-PY")}
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-slate-900 block">{g.descripcion}</span>
                          {g.categoria && <span className="inline-block mt-0.5 text-[9px] uppercase bg-slate-100 px-1 border rounded text-slate-600">{g.categoria}</span>}
                          <span className={`ml-1 text-[9px] font-bold ${g.estado === "ANULADO" ? "text-red-600" : "text-emerald-600"}`}>{g.estado}</span>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-red-600">
                          {formatMoney(g.monto)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {g.estado !== "ANULADO" && <button
                            onClick={() => handleDeleteGasto(g.id, g.descripcion)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors inline-block cursor-pointer"
                            title="Solicitar anulación"
                          >
                            <Trash2 size={14} />
                          </button>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <section className="rounded-xl border bg-white p-4"><h3 className="font-bold">Movimientos financieros del día</h3><div className="mt-2 overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="p-2 text-left">Fecha</th><th className="p-2 text-left">Categoría</th><th className="p-2 text-left">Método</th><th className="p-2 text-left">Usuario</th><th className="p-2 text-right">Resultado</th><th className="p-2 text-right">Caja</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id} className="border-t"><td className="p-2">{new Date(movement.creadoEn).toLocaleString("es-PY")}</td><td className="p-2">{movement.categoria}</td><td className="p-2">{movement.metodoPago || "-"}</td><td className="p-2">{movement.usuario.nombre}</td><td className="p-2 text-right">{movement.afectaResultado ? `${movement.tipo === "EGRESO" ? "-" : "+"}${formatMoney(movement.importe)}` : "-"}</td><td className="p-2 text-right">{movement.afectaCaja ? `${movement.tipo === "EGRESO" ? "-" : "+"}${formatMoney(movement.importe)}` : "-"}</td></tr>)}</tbody></table></div></section>

      <section className="rounded-xl border bg-white p-4"><h3 className="font-bold">Cuotas pendientes</h3>{installmentMessage && <p className="mt-2 text-sm">{installmentMessage}</p>}<div className="mt-3 space-y-2">{credits.flatMap((credit) => credit.cuotas.map((installment: any) => <form key={installment.id} action={async (data) => { const result = await registerInstallmentPayment(data); setInstallmentMessage(result.error ?? "Cobro registrado."); }} className="grid grid-cols-2 gap-2 rounded border p-2 text-xs md:grid-cols-6"><span>{credit.venta.cliente.nombre} {credit.venta.cliente.apellido}</span><span>Cuota #{installment.numero} · {new Date(installment.venceEn).toLocaleDateString("es-PY")}</span><span>{installment.estado} · saldo {formatMoney(installment.monto - installment.pagado)}</span><input type="hidden" name="installmentId" value={installment.id} /><input required name="amount" type="number" min="1" max={installment.monto - installment.pagado} placeholder="Monto" className="rounded border p-1" /><select name="paymentMethod" className="rounded border p-1"><option>EFECTIVO</option><option>TARJETA</option><option>TRANSFERENCIA</option></select><button className="rounded bg-slate-900 p-1 text-white">Registrar cobro</button></form>))}</div></section>

      {/* MODAL: REGISTRAR COBRO CLIENTE */}
      {isCobroModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl border">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="text-slate-500" size={16} />
                <span>Registrar Cobro</span>
              </h3>
              <button onClick={() => setIsCobroModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {cobroError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                {cobroError}
              </div>
            )}

            <form onSubmit={handleRegistrarCobro} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cliente</label>
                <input type="text" disabled value={`${selectedClient.nombre} ${selectedClient.apellido}`} className="w-full border rounded p-2 text-xs bg-slate-50 font-semibold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo Deudor</label>
                  <input type="text" disabled value={formatMoney(selectedClient.saldoDeudor)} className="w-full border rounded p-2 text-xs bg-slate-50 font-bold text-red-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Monto a Cobrar *</label>
                  <input required name="monto" type="number" min="1000" step="1000" max={selectedClient.saldoDeudor} defaultValue={selectedClient.saldoDeudor} className="w-full border rounded p-2 text-xs bg-white font-bold outline-none focus:border-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Método de pago</label>
                  <select name="metodoPago" className="w-full border rounded p-2 text-xs bg-white"><option>EFECTIVO</option><option>TARJETA</option><option>TRANSFERENCIA</option></select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Comprobante (URL)</label>
                  <input name="comprobanteUrl" type="url" placeholder="Opcional" className="w-full border rounded p-2 text-xs bg-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsCobroModalOpen(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer">Cancelar</button>
                <button type="submit" disabled={cobroLoading} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50">
                  {cobroLoading ? "Guardando..." : "Confirmar Cobro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR GASTO */}
      {isGastoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl border">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <TrendingDown className="text-red-500" size={16} />
                <span>Registrar Gasto Diario</span>
              </h3>
              <button onClick={() => setIsGastoModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {gastoError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                {gastoError}
              </div>
            )}

            <form onSubmit={handleRegistrarGasto} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Descripción del Gasto *</label>
                <input required name="descripcion" type="text" placeholder="Ej. Combustible camión despacho" className="w-full border rounded p-2 text-xs bg-white outline-none focus:border-slate-400 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Monto (Gs.) *</label>
                  <input required name="monto" type="number" min="1000" step="500" placeholder="0" className="w-full border rounded p-2 text-xs bg-white outline-none focus:border-slate-400 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Categoría</label>
                  <select name="categoria" className="w-full border rounded p-2 text-xs bg-white outline-none focus:border-slate-400 font-medium">
                    <option value="Combustible">Combustible</option>
                    <option value="Viáticos">Viáticos / Almuerzo</option>
                    <option value="Servicios">Servicios Básicos</option>
                    <option value="Mercadería">Mercadería / Embalajes</option>
                    <option value="Otros">Otros Gastos</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsGastoModalOpen(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer">Cancelar</button>
                <button type="submit" disabled={gastoLoading} className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50">
                  {gastoLoading ? "Registrando..." : "Registrar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
