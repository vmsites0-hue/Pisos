import { InventarioClient } from "@/modules/inventory/components/InventarioClient";
import { getInventoryPageData } from "@/modules/inventory/repositories/inventory.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function InventarioPage() {
  await requireAuthenticatedUser();
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
