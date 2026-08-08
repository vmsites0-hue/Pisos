import { LogisticaClient } from "@/modules/logistics/components/LogisticaClient";
import { getLogisticsPageData } from "@/modules/logistics/repositories/logistics.repository";

export default async function LogisticaPage() {
  const { sales, branches } = await getLogisticsPageData();

  return <LogisticaClient sales={sales} sucursales={branches} />;
}
