"use client";

import { useState } from "react";
import { Plus, Trash2, FolderPlus, X } from "lucide-react";
import { createCategoria, deleteCategoria } from "@/modules/inventory/actions/categories.actions";

interface CategoryFormProps {
  categories: { id: number; nombre: string }[];
}

export function CategoryForm({ categories }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await createCategoria(nombre);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess("Categoría agregada correctamente.");
      setNombre("");
      // Limpiar mensaje de éxito después de un tiempo
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return;

    setError(null);
    setSuccess(null);
    const res = await deleteCategoria(id);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess("Categoría eliminada.");
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccess(null);
        }}
        className="bg-white border text-slate-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <FolderPlus size={18} />
        <span>Categorías</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="text-xl font-bold">Gestionar Categorías</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Formulario de creación */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
              <input
                required
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="Nombre de la nueva categoría"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 text-white px-3 py-2 rounded-md flex items-center gap-1 hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer"
              >
                <Plus size={16} />
                <span>{loading ? "Añadiendo..." : "Añadir"}</span>
              </button>
            </form>

            <h4 className="text-sm font-semibold text-slate-500 mb-2">Categorías Existentes ({categories.length})</h4>
            
            {/* Listado de categorías con scroll */}
            <div className="flex-1 overflow-y-auto border rounded-lg divide-y max-h-[40vh]">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  No hay categorías creadas aún.
                </div>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{cat.nombre}</span>
                    <button
                      onClick={() => handleDelete(cat.id, cat.nombre)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
