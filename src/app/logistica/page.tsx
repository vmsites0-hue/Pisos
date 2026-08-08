import { LogisticaClient } from "@/modules/logistics/components/LogisticaClient";
import { getLogisticsPageData } from "@/modules/logistics/repositories/logistics.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function LogisticaPage() {
  await requireAuthenticatedUser();
  const { sales, branches } = await getLogisticsPageData();

  return <LogisticaClient sales={sales} sucursales={branches} />;
}
