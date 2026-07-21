import { prisma } from "@/lib/prisma";
import { FinanzasClient } from "@/components/finanzas/FinanzasClient";

export default async function FinanzasPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Obtener ventas DEL DÍA de hoy
  const salesHoy = await prisma.venta.findMany({
    where: {
      fecha: { gte: todayStart },
    },
    orderBy: {
      fecha: "desc",
    },
  });

  // 2. Obtener clientes con saldo deudor
  const debtorClients = await prisma.cliente.findMany({
    where: {
      saldoDeudor: {
        gt: 0,
      },
    },
    orderBy: {
      saldoDeudor: "desc",
    },
  });

  // 3. Obtener gastos DEL DÍA de hoy
  const gastosHoy = await prisma.gasto.findMany({
    where: {
      fecha: { gte: todayStart },
    },
    orderBy: {
      fecha: "desc",
    },
  });

  return (
    <FinanzasClient sales={salesHoy} debtorClients={debtorClients} gastos={gastosHoy} />
  );
}
