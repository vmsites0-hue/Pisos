import { VentasClient } from "@/modules/sales/components/VentasClient";
import { getSalesPageData } from "@/modules/sales/repositories/sales.repository";

export default async function VentasPage() {
  const { branches, categories, customers, products, inventory } = await getSalesPageData();

  return (
    <VentasClient
      products={products}
      categories={categories}
      sucursales={branches}
      inventarios={inventory}
      clientes={customers}
    />
  );
}
