import { prisma } from "@/lib/prisma";
import { VentasClient } from "@/components/ventas/VentasClient";

export default async function VentasPage() {
  // 1. Obtener todas las sucursales activas
  const sucursales = await prisma.sucursal.findMany({
    where: {
      activa: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  // 2. Obtener todas las categorías para filtros
  const categorias = await prisma.categoria.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  // 3. Obtener todos los clientes registrados
  const clientes = await prisma.cliente.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  // 4. Obtener todos los productos
  const productos = await prisma.producto.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  // 5. Obtener todos los registros de inventario con stock disponible
  const inventarios = await prisma.inventario.findMany({
    include: {
      producto: true,
      sucursal: true,
    },
    where: {
      stockActual: {
        gt: 0,
      },
    },
    orderBy: {
      producto: {
        codigo: "asc",
      },
    },
  });

  return (
    <VentasClient 
      products={productos}
      categories={categorias}
      sucursales={sucursales}
      inventarios={inventarios}
      clientes={clientes}
    />
  );
}
