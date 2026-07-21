import { prisma } from "@/lib/prisma";
import { LogisticaClient } from "@/components/logistica/LogisticaClient";

export default async function LogisticaPage() {
  // 1. Obtener todas las ventas con sus detalles
  const sales = await prisma.venta.findMany({
    include: {
      detalles: {
        include: {
          producto: true,
        },
      },
      cliente: true,
      sucursal: true,
    },
    orderBy: {
      fecha: "desc",
    },
  });

  // 2. Obtener todas las sucursales para el filtro
  const sucursales = await prisma.sucursal.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  return (
    <LogisticaClient sales={sales} sucursales={sucursales} />
  );
}
