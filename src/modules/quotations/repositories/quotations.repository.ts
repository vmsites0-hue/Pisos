import { prisma } from "@/lib/prisma";
import { expireDueReservations } from "@/modules/reservations/services/expiration.service";

export async function getQuotationsPageData() {
  await expireDueReservations();
  const [products, customers, categories, quotations] = await Promise.all([
    prisma.producto.findMany({
      include: { categoria: true, variantes: { where: { activa: true }, orderBy: { id: "asc" } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.cliente.findMany({ where: { activo: true, sucursal: { esPrincipal: true } }, orderBy: { nombre: "asc" } }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.presupuesto.findMany({
      where: { sucursal: { esPrincipal: true } },
      include: {
        cliente: true,
        detalles: { include: { producto: true, variante: true, lineasReserva: { where: { estado: "ACTIVA" } } } },
        reservas: { include: { creadaPor: { select: { nombre: true } }, lineas: true }, orderBy: { creadaEn: "desc" } },
      },
      orderBy: { fecha: "desc" },
    }),
  ]);

  return { products, customers, categories, quotations };
}
