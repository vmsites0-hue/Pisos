import { FinanzasClient } from "@/modules/finance/components/FinanzasClient";
import { getFinancePageData } from "@/modules/finance/repositories/finance.repository";

export default async function FinanzasPage() {
  const { sales, debtorCustomers, expenses } = await getFinancePageData();

  return (
    <FinanzasClient
      sales={sales}
      debtorClients={debtorCustomers}
      gastos={expenses}
    />
  );
}
