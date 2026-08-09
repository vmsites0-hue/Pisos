import { InventarioClient } from "@/modules/inventory/components/InventarioClient";
import { getInventoryPageData } from "@/modules/inventory/repositories/inventory.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function InventarioPage() {
  await requireAuthenticatedUser();
  const { products, categories, families, brands, units, branches, inventory, movements } = await getInventoryPageData();

  return (
    <InventarioClient
      products={products}
      categories={categories}
      families={families}
      brands={brands}
      units={units}
      sucursales={branches}
      inventarios={inventory}
      movements={movements}
    />
  );
}
