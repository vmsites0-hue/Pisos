import { prisma } from "@/lib/prisma";
import { InventarioClient } from "@/components/inventario/InventarioClient";

export default async function InventarioPage() {
  // 1. Obtener todos los productos con su respectiva categoría
  const productos = await prisma.producto.findMany({
    include: {
      categoria: true,
    },
    orderBy: {
      creadoEn: "desc",
    },
  });

  // 2. Obtener todas las categorías para los dropdowns
  const categorias = await prisma.categoria.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  // 3. Obtener todas las sucursales para poder filtrar o ajustar stock
  const sucursales = await prisma.sucursal.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  // 4. Obtener todos los registros de inventario actuales con sus relaciones
  const inventarios = await prisma.inventario.findMany({
    include: {
      producto: true,
      sucursal: true,
    },
    orderBy: {
      producto: {
        codigo: "asc",
      },
    },
  });

  return (
    <InventarioClient 
      products={productos}
      categories={categorias}
      sucursales={sucursales}
      inventarios={inventarios}
    />
  );
}
