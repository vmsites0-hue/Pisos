import Link from "next/link";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Settings,
  CreditCard,
  FileText
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">ERPiso</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <SidebarItem href="/" icon={<Home size={20} />} label="Dashboard" />
        <SidebarItem href="/ventas" icon={<ShoppingCart size={20} />} label="Ventas (POS)" />
        <SidebarItem href="/presupuestos" icon={<FileText size={20} />} label="Presupuestos" />
        <SidebarItem href="/inventario" icon={<Package size={20} />} label="Inventario" />
        <SidebarItem href="/clientes" icon={<Users size={20} />} label="Clientes" />
        <SidebarItem href="/logistica" icon={<Truck size={20} />} label="Logística" />
        <SidebarItem href="/finanzas" icon={<CreditCard size={20} />} label="Finanzas" />
      </nav>
      
      <div className="p-4 border-t">
        <SidebarItem href="/configuracion" icon={<Settings size={20} />} label="Configuración" />
      </div>
    </aside>
  );
}

function SidebarItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
