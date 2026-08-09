import { PresupuestoClient } from "@/modules/quotations/components/PresupuestoClient";
import { getQuotationsPageData } from "@/modules/quotations/repositories/quotations.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function PresupuestosPage() {
  await requireAuthenticatedUser();
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
