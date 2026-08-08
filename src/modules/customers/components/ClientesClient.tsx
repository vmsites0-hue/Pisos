"use client";

import { useState } from "react";
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  AlertCircle
} from "lucide-react";
import { ClienteForm } from "./ClienteForm";
import { deleteCliente } from "@/modules/customers/actions/customers.actions";

interface ClientesClientProps {
  clientes: any[];
}

export function ClientesClient({ clientes }: ClientesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  // Filtrar clientes
  const filteredClientes = clientes.filter((cli) => {
    const query = searchQuery.toLowerCase();
    return (
      cli.nombre.toLowerCase().includes(query) ||
      cli.apellido.toLowerCase().includes(query) ||
      cli.documento.toLowerCase().includes(query) ||
      (cli.ruc && cli.ruc.toLowerCase().includes(query)) ||
      (cli.telefono && cli.telefono.includes(query))
    );
  });

  // Eliminar Cliente
  async function handleDeleteCliente(id: number, fullName: string) {
    if (!confirm(`¿Estás seguro de eliminar al cliente "${fullName}"?\nEsta acción no se puede deshacer.`)) return;

    const res = await deleteCliente(id);
    if (res.error) {
      alert(res.error);
    }
  }

  // Abrir para crear
  const handleNewCliente = () => {
    setSelectedCliente(null);
    setIsModalOpen(true);
  };

  // Abrir para editar
  const handleEditCliente = (cli: any) => {
    setSelectedCliente(cli);
    setIsModalOpen(true);
  };

  // Formateador de moneda (Gs.)
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Base de Clientes</h2>
          <p className="text-slate-500">Registra información de facturación y línea de crédito.</p>
        </div>
        <button 
          onClick={handleNewCliente}
          className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer text-sm font-medium"
        >
          <UserPlus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl border flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellido, CI o RUC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Listado / Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Cliente / Documento</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Dirección</th>
              <th className="px-6 py-4 text-right">Límite Crédito</th>
              <th className="px-6 py-4 text-right">Saldo Deudor</th>
              <th className="px-6 py-4 text-right">Disponible</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredClientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No se encontraron clientes registrados.
                </td>
              </tr>
            ) : (
              filteredClientes.map((cli) => {
                const disponible = Math.max(0, cli.limiteCredito - cli.saldoDeudor);
                const hasDebt = cli.saldoDeudor > 0;
                const creditEnabled = cli.limiteCredito > 0;

                return (
                  <tr key={cli.id} className="hover:bg-slate-50 transition-colors">
                    {/* Nombre y Documento */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{cli.nombre} {cli.apellido}</div>
                      <div className="text-slate-500 text-xs mt-0.5 space-x-2">
                        <span>CI: {cli.documento}</span>
                        {cli.ruc && <span className="text-slate-400">| RUC: {cli.ruc}</span>}
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col gap-1 text-xs">
                        {cli.telefono && (
                          <div className="flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" />
                            <span>{cli.telefono}</span>
                          </div>
                        )}
                        {cli.correo && (
                          <div className="flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            <span className="truncate max-w-[150px]">{cli.correo}</span>
                          </div>
                        )}
                        {!cli.telefono && !cli.correo && (
                          <span className="text-slate-400 italic">Sin datos</span>
                        )}
                      </div>
                    </td>

                    {/* Dirección */}
                    <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate" title={cli.direccion || ""}>
                      {cli.direccion ? (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{cli.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Sin especificar</span>
                      )}
                    </td>

                    {/* Límite Crédito */}
                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                      {creditEnabled ? formatMoney(cli.limiteCredito) : <span className="text-slate-400 italic text-xs">Sin crédito</span>}
                    </td>

                    {/* Saldo Deudor */}
                    <td className="px-6 py-4 text-right">
                      {hasDebt ? (
                        <span className="font-bold text-red-600">
                          {formatMoney(cli.saldoDeudor)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Al día</span>
                      )}
                    </td>

                    {/* Disponible */}
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {creditEnabled ? (
                        <span className={disponible === 0 ? "text-red-500" : "text-blue-600"}>
                          {formatMoney(disponible)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => handleEditCliente(cli)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors inline-block cursor-pointer" 
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCliente(cli.id, `${cli.nombre} ${cli.apellido}`)}
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

      {/* Modal de Cliente */}
      <ClienteForm 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedCliente(null); }}
        cliente={selectedCliente}
      />
    </div>
  );
}
