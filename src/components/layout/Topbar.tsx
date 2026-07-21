import { Bell, Search, Store } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex-1 max-w-xl flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar clientes, productos o ventas (Cmd+K)..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
          <Store size={16} />
          <span>Sucursal Central</span>
        </div>
        
        <button className="text-slate-500 hover:text-slate-900 relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
          JS
        </div>
      </div>
    </header>
  );
}
