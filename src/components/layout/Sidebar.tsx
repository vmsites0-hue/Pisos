import Link from "next/link";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Settings,
  CreditCard,
  FileText,
  ShieldCheck,
  ScrollText,
  Bell,
  FileSpreadsheet
} from "lucide-react";
import { getAuthenticatedUser } from "@/modules/auth/services/session.service";
import { getUserPermissions } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";

export async function Sidebar() {
  const user = await getAuthenticatedUser();
  const permissions = user ? await getUserPermissions(user.id) : [];

  const has = (code: string | string[]) => {
    if (Array.isArray(code)) {
      return code.some((c) => permissions.includes(c));
    }
    return permissions.includes(code);
  };

  const navItems = [
    { href: "/", icon: <Home size={20} />, label: "Dashboard", visible: true },
    { href: "/ventas", icon: <ShoppingCart size={20} />, label: "Ventas (POS)", visible: has(PERMISSIONS.SALES_CREATE) },
    { href: "/presupuestos", icon: <FileText size={20} />, label: "Presupuestos", visible: has(PERMISSIONS.QUOTATIONS_MANAGE) },
    { href: "/inventario", icon: <Package size={20} />, label: "Inventario", visible: has([PERMISSIONS.PRODUCTS_MANAGE, PERMISSIONS.INVENTORY_ADJUST]) },
    { href: "/clientes", icon: <Users size={20} />, label: "Clientes", visible: has(PERMISSIONS.CUSTOMERS_MANAGE) },
    { href: "/logistica", icon: <Truck size={20} />, label: "Logística", visible: has([PERMISSIONS.LOGISTICS_UPDATE, PERMISSIONS.DELIVERY_ASSIGN, PERMISSIONS.DELIVERY_CONFIRM_ANY]) },
    { href: "/finanzas", icon: <CreditCard size={20} />, label: "Finanzas", visible: has([PERMISSIONS.EXPENSES_CREATE, PERMISSIONS.PAYMENTS_CREATE]) },
    { href: "/aprobaciones", icon: <ShieldCheck size={20} />, label: "Aprobaciones", visible: has([PERMISSIONS.APPROVALS_REVIEW, PERMISSIONS.APPROVALS_POLICY_MANAGE]) },
    { href: "/auditoria", icon: <ScrollText size={20} />, label: "Auditoría", visible: has(PERMISSIONS.AUDIT_VIEW) },
    { href: "/notificaciones", icon: <Bell size={20} />, label: "Notificaciones", visible: true },
    { href: "/reportes", icon: <FileSpreadsheet size={20} />, label: "Reportes", visible: has([PERMISSIONS.AUDIT_VIEW, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.SALES_CREATE]) },
  ];

  const canSeeSettings = has([
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.BRANCHES_MANAGE,
    PERMISSIONS.DISCOUNTS_MANAGE,
  ]);

  return (
    <aside className="w-64 border-r bg-white h-screen flex flex-col fixed left-0 top-0 no-print">
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Distri Pisos</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.visible).map(item => (
          <SidebarItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}
      </nav>
      
      {canSeeSettings && (
        <div className="p-4 border-t">
          <SidebarItem href="/configuracion" icon={<Settings size={20} />} label="Configuración" />
        </div>
      )}
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

