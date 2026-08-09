"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, CreditCard } from "lucide-react";
import { createCliente, updateCliente } from "@/modules/customers/actions/customers.actions";

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: any; // Si existe, es edición. Si no, creación.
}

export function ClienteForm({ isOpen, onClose, cliente }: ClienteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState(cliente?.tipo ?? "PERSONA");

  useEffect(() => {
    setError(null);
    setTipo(cliente?.tipo ?? "PERSONA");
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    let res;
    if (cliente) {
      res = await updateCliente(cliente.id, formData);
    } else {
      res = await createCliente(formData);
    }

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col shadow-xl border">
        <div className="flex justify-between items-center pb-3 border-b mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="text-slate-500" size={20} />
            <span>{cliente ? "Editar Cliente" : "Nuevo Cliente"}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Tipo de cliente</label><select name="tipo" value={tipo} onChange={(event) => setTipo(event.target.value)} className="w-full rounded-md border bg-white p-2 text-sm"><option value="PERSONA">Persona</option><option value="EMPRESA">Empresa</option></select></div>
          {tipo === "EMPRESA" && <div><label className="block text-sm font-medium text-slate-700 mb-1">Razón social *</label><input required name="razonSocial" defaultValue={cliente?.razonSocial || cliente?.nombre || ""} className="w-full rounded-md border p-2 text-sm" /></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                required={tipo === "PERSONA"}
                name="nombre"
                type="text"
                defaultValue={cliente?.nombre || ""}
                placeholder="Ej. Juan"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
              <input
                required={tipo === "PERSONA"}
                name="apellido"
                type="text"
                defaultValue={cliente?.apellido || ""}
                placeholder="Ej. Pérez"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Documento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cédula / Documento (CI) *</label>
              <input
                required
                name="documento"
                type="text"
                defaultValue={cliente?.documento || ""}
                placeholder="Ej. 1234567"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            {/* RUC */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RUC (Opcional)</label>
              <input
                name="ruc"
                type="text"
                defaultValue={cliente?.ruc || ""}
                placeholder="Ej. 1234567-8"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (Opcional)</label>
              <input
                name="telefono"
                type="text"
                defaultValue={cliente?.telefono || ""}
                placeholder="Ej. 0981123456"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
              <input
                name="correo"
                type="email"
                defaultValue={cliente?.correo || ""}
                placeholder="Ej. juan@correo.com"
                className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección (Opcional)</label>
            <input
              name="direccion"
              type="text"
              defaultValue={cliente?.direccion || ""}
              placeholder="Ej. Av. Mariscal López 1234, Asunción"
              className="w-full border rounded-md p-2 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {/* Línea de Crédito */}
          <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={14} />
              <span>Cuenta Corriente y Crédito</span>
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Límite de Crédito Autorizado</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">Gs.</span>
                <input
                  name="limiteCredito"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={cliente?.limiteCredito || 0}
                  placeholder="0"
                  className="w-full border rounded-md pl-10 pr-2 py-2 bg-white text-sm outline-none focus:border-slate-400"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Define el monto máximo que este cliente puede tener como saldo deudor. Deja en 0 para no habilitar crédito.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              {loading ? "Guardando..." : cliente ? "Guardar Cambios" : "Registrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
