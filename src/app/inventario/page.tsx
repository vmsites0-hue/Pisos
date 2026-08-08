import { InventarioClient } from "@/modules/inventory/components/InventarioClient";
import { getInventoryPageData } from "@/modules/inventory/repositories/inventory.repository";

export default async function InventarioPage() {
  const { products, categories, branches, inventory } = await getInventoryPageData();

  return (
    <InventarioClient
      products={products}
      categories={categories}
      sucursales={branches}
      inventarios={inventory}
    />
  );
}
