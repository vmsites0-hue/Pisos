import { prisma } from "@/lib/prisma";
import { SucursalForm } from "@/components/sucursales/SucursalForm";
import { ConfiguracionClient } from "@/components/configuracion/ConfiguracionClient";

export default async function ConfiguracionPage() {
  const sucursales = await prisma.sucursal.findMany({
    orderBy: { creadoEn: 'desc' }
  });

  const reglas = await prisma.reglaDescuento.findMany({
    orderBy: { creadoEn: 'desc' }
  });

  const categories = await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SucursalForm />
      </div>
      <ConfiguracionClient 
        sucursales={sucursales} 
        reglas={reglas}
        categories={categories}
      />
    </div>
  );
}
