import { FinanzasClient } from "@/modules/finance/components/FinanzasClient";
import { getFinancePageData } from "@/modules/finance/repositories/finance.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function FinanzasPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAuthenticatedUser();
  const query = await searchParams;
  const filters = { from: query.from, to: query.to, userId: query.userId ? Number(query.userId) : undefined, paymentMethod: query.paymentMethod };
  const { sales, debtorCustomers, expenses, credits, movements, users } = await getFinancePageData(filters);

  return (
    <FinanzasClient
      sales={sales}
      debtorClients={debtorCustomers}
      gastos={expenses}
      credits={credits}
      movements={movements}
      users={users}
      filters={filters}
    />
  );
}
