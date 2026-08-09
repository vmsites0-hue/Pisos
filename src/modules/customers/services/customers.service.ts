import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { validateCustomerIdentity } from "@/modules/customers/domain/customer";
import { recordAudit } from "@/modules/audit/services/audit.service";

export async function createCliente(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  const mainBranch = await getMainBranch();
  try {
    const tipo = String(formData.get("tipo") ?? "PERSONA");
    const razonSocial = String(formData.get("razonSocial") ?? "").trim() || null;
    const nombrePersona = String(formData.get("nombre") ?? "").trim();
    const apellidoPersona = String(formData.get("apellido") ?? "").trim();
    const nombre = tipo === "EMPRESA" ? razonSocial ?? "" : nombrePersona;
    const apellido = tipo === "EMPRESA" ? "" : apellidoPersona;
    const documento = (formData.get("documento") as string)?.trim();
    const ruc = (formData.get("ruc") as string)?.trim() || null;
    const telefono = (formData.get("telefono") as string)?.trim() || null;
    const correo = (formData.get("correo") as string)?.trim() || null;
    const direccion = (formData.get("direccion") as string)?.trim() || null;
    
    const limiteCreditoRaw = formData.get("limiteCredito") as string;
    const limiteCredito = limiteCreditoRaw ? parseFloat(limiteCreditoRaw) : 0;

    validateCustomerIdentity({ type: tipo, name: nombrePersona, lastName: apellidoPersona, legalName: razonSocial ?? "", document: documento, taxId: ruc });

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
        tipo,
        razonSocial,
        documento,
        ruc,
        telefono,
        correo,
        direccion,
        limiteCredito,
        saldoDeudor: 0,
      },
    });
    await recordAudit({ userId: actor.id, action: "CLIENTE_CREADO", entity: "Cliente", entityId: nuevoCliente.id, after: nuevoCliente });

    revalidatePath("/clientes");
    return { success: true, cliente: nuevoCliente };
  } catch (error: any) {
    return { error: error.message || "Error al crear el cliente." };
  }
}

export async function updateCliente(id: number, formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  try {
    const tipo = String(formData.get("tipo") ?? "PERSONA");
    const razonSocial = String(formData.get("razonSocial") ?? "").trim() || null;
    const nombrePersona = String(formData.get("nombre") ?? "").trim();
    const apellidoPersona = String(formData.get("apellido") ?? "").trim();
    const nombre = tipo === "EMPRESA" ? razonSocial ?? "" : nombrePersona;
    const apellido = tipo === "EMPRESA" ? "" : apellidoPersona;
    const documento = (formData.get("documento") as string)?.trim();
    const ruc = (formData.get("ruc") as string)?.trim() || null;
    const telefono = (formData.get("telefono") as string)?.trim() || null;
    const correo = (formData.get("correo") as string)?.trim() || null;
    const direccion = (formData.get("direccion") as string)?.trim() || null;
    
    const limiteCreditoRaw = formData.get("limiteCredito") as string;
    const limiteCredito = limiteCreditoRaw ? parseFloat(limiteCreditoRaw) : 0;

    validateCustomerIdentity({ type: tipo, name: nombrePersona, lastName: apellidoPersona, legalName: razonSocial ?? "", document: documento, taxId: ruc });

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

    const before = await prisma.cliente.findUniqueOrThrow({ where: { id } });
    const updated = await prisma.cliente.update({
      where: { id },
      data: {
        nombre,
        apellido,
        tipo,
        razonSocial,
        activo: formData.get("activo") !== "false",
        documento,
        ruc,
        telefono,
        correo,
        direccion,
        limiteCredito,
      },
    });
    await recordAudit({ userId: actor.id, action: "CLIENTE_ACTUALIZADO", entity: "Cliente", entityId: id, before, after: updated });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el cliente." };
  }
}

export async function deleteCliente(id: number) {
  const actor = await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  try {
    // Verificar si tiene ventas asociadas
    const before = await prisma.cliente.findUniqueOrThrow({ where: { id } });
    const [ventasCount, quotationsCount] = await Promise.all([prisma.venta.count({ where: { clienteId: id } }), prisma.presupuesto.count({ where: { clienteId: id } })]);
    if (ventasCount + quotationsCount > 0) {
      const after = await prisma.cliente.update({ where: { id }, data: { activo: false } });
      await recordAudit({ userId: actor.id, action: "CLIENTE_DESACTIVADO", entity: "Cliente", entityId: id, before, after });
      revalidatePath("/clientes"); return { success: true, deactivated: true };
    }
    await prisma.cliente.delete({ where: { id } });
    await recordAudit({ userId: actor.id, action: "CLIENTE_ELIMINADO", entity: "Cliente", entityId: id, before });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el cliente." };
  }
}
