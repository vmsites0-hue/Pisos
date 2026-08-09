import { ClientesClient } from "@/modules/customers/components/ClientesClient";
import { getCustomersPageData } from "@/modules/customers/repositories/customers.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function ClientesPage() {
  await requireAuthenticatedUser();
  const customers = await getCustomersPageData();

  return <ClientesClient clientes={customers} />;
}
