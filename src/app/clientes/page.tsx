import { prisma } from "@/lib/prisma";
import { ClientesClient } from "@/components/clientes/ClientesClient";

export default async function ClientesPage() {
  // Obtener todos los clientes ordenados por creación
  const clientes = await prisma.cliente.findMany({
    orderBy: {
      creadoEn: "desc",
    },
  });

  return (
    <ClientesClient clientes={clientes} />
  );
}
