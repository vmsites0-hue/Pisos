import { prisma } from "@/lib/prisma";
import { PresupuestoClient } from "@/components/presupuestos/PresupuestoClient";

export default async function PresupuestosPage() {
  // 1. Obtener productos
  const products = await prisma.producto.findMany({
    include: {
      categoria: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  // 2. Obtener clientes
  const clientes = await prisma.cliente.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  // 3. Obtener categorías
  const categories = await prisma.categoria.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  // 4. Obtener presupuestos guardados
  const presupuestos = await prisma.presupuesto.findMany({
    include: {
      cliente: true,
      detalles: {
        include: {
          producto: true,
        },
      },
    },
    orderBy: {
      fecha: "desc",
    },
  });

  return (
    <PresupuestoClient 
      products={products}
      clientes={clientes}
      categories={categories}
      presupuestos={presupuestos}
    />
  );
}
