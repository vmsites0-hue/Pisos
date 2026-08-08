import { ClientesClient } from "@/modules/customers/components/ClientesClient";
import { getCustomersPageData } from "@/modules/customers/repositories/customers.repository";

export default async function ClientesPage() {
  const customers = await getCustomersPageData();

  return <ClientesClient clientes={customers} />;
}
