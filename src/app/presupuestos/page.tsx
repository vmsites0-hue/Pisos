import { PresupuestoClient } from "@/modules/quotations/components/PresupuestoClient";
import { getQuotationsPageData } from "@/modules/quotations/repositories/quotations.repository";

export default async function PresupuestosPage() {
  const { products, customers, categories, quotations } = await getQuotationsPageData();

  return (
    <PresupuestoClient
      products={products}
      clientes={customers}
      categories={categories}
      presupuestos={quotations}
    />
  );
}
