import { FinanzasClient } from "@/modules/finance/components/FinanzasClient";
import { getFinancePageData } from "@/modules/finance/repositories/finance.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function FinanzasPage() {
  await requireAuthenticatedUser();
  const { sales, debtorCustomers, expenses, credits } = await getFinancePageData();

  return (
    <FinanzasClient
      sales={sales}
      debtorClients={debtorCustomers}
      gastos={expenses}
      credits={credits}
    />
  );
}
