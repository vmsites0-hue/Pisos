import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";

export async function createCliente(formData: FormData) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  const mainBranch = await getMainBranch();
  try {
    const nombre = (formData.get("nombre") as string)?.trim();
    const apellido = (formData.get("apellido") as string)?.trim();
    const documento = (formData.get("documento") as string)?.trim();
    const ruc = (formData.get("ruc") as string)?.trim() || null;
    const telefono = (formData.get("telefono") as string)?.trim() || null;
    const correo = (formData.get("correo") as string)?.trim() || null;
    const direccion = (formData.get("direccion") as string)?.trim() || null;
    
    const limiteCreditoRaw = formData.get("limiteCredito") as string;
    const limiteCredito = limiteCreditoRaw ? parseFloat(limiteCreditoRaw) : 0;

    if (!nombre || !apellido || !documento) {
      return { error: "Faltan campos obligatorios (Nombre, Apellido y Documento)." };
    }

    // Verificar unicidad de Documento
    const existeDocumento = await prisma.cliente.findUnique({
      where: { documento },
    });
    if (existeDocumento) {
      return { error: `El documento/CI '${documento}' ya está registrado.` };
    }

    // Verificar unicidad de RUC
    if (ruc) {
      const existeRuc = await prisma.cliente.findUnique({
        where: { ruc },
      });
      if (existeRuc) {
        return { error: `El RUC '${ruc}' ya está registrado.` };
      }
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        sucursalId: mainBranch.id,
        nombre,
        apellido,
        documento,
        ruc,
        telefono,
        correo,
        direccion,
        limiteCredito,
        saldoDeudor: 0,
      },
    });

    revalidatePath("/clientes");
    return { success: true, cliente: nuevoCliente };
  } catch (error: any) {
    return { error: error.message || "Error al crear el cliente." };
  }
}

export async function updateCliente(id: number, formData: FormData) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  try {
    const nombre = (formData.get("nombre") as string)?.trim();
    const apellido = (formData.get("apellido") as string)?.trim();
    const documento = (formData.get("documento") as string)?.trim();
    const ruc = (formData.get("ruc") as string)?.trim() || null;
    const telefono = (formData.get("telefono") as string)?.trim() || null;
    const correo = (formData.get("correo") as string)?.trim() || null;
    const direccion = (formData.get("direccion") as string)?.trim() || null;
    
    const limiteCreditoRaw = formData.get("limiteCredito") as string;
    const limiteCredito = limiteCreditoRaw ? parseFloat(limiteCreditoRaw) : 0;

    if (!nombre || !apellido || !documento) {
      return { error: "Faltan campos obligatorios (Nombre, Apellido y Documento)." };
    }

    // Verificar unicidad de Documento (excluyendo al actual)
    const existeDocumento = await prisma.cliente.findFirst({
      where: { documento, NOT: { id } },
    });
    if (existeDocumento) {
      return { error: `El documento/CI '${documento}' ya lo tiene otro cliente.` };
    }

    // Verificar unicidad de RUC (excluyendo al actual)
    if (ruc) {
      const existeRuc = await prisma.cliente.findFirst({
        where: { ruc, NOT: { id } },
      });
      if (existeRuc) {
        return { error: `El RUC '${ruc}' ya lo tiene otro cliente.` };
      }
    }

    await prisma.cliente.update({
      where: { id },
      data: {
        nombre,
        apellido,
        documento,
        ruc,
        telefono,
        correo,
        direccion,
        limiteCredito,
      },
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el cliente." };
  }
}

export async function deleteCliente(id: number) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  try {
    // Verificar si tiene ventas asociadas
    const ventasCount = await prisma.venta.count({
      where: { clienteId: id },
    });

    if (ventasCount > 0) {
      return { error: "No se puede eliminar el cliente porque tiene ventas asociadas." };
    }

    await prisma.cliente.delete({
      where: { id },
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el cliente." };
  }
}
