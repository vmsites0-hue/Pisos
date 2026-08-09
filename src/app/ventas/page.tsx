import { VentasClient } from "@/modules/sales/components/VentasClient";
import { getSalesPageData } from "@/modules/sales/repositories/sales.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function VentasPage() {
  await requireAuthenticatedUser();
  const { branches, categories, customers, products, inventory, creditPlans } = await getSalesPageData();

  return (
    <VentasClient
      products={products}
      categories={categories}
      sucursales={branches}
      inventarios={inventory}
      clientes={customers}
      creditPlans={creditPlans}
    />
  );
}
