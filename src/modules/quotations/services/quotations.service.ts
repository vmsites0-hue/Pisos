import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { getSystemParameterSnapshot } from "@/modules/settings/services/system-parameters.service";
import { calculateProductQuantity } from "@/modules/inventory/domain/quantity-conversion";
import { canEditQuotation, resolveQuotationExpiration, validateQuotationTotals } from "@/modules/quotations/domain/quotation";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { normalizeRecalculationPolicy, quotationValuesChanged } from "@/modules/quotations/domain/recalculation";

export interface DetallePresupuestoInput {
  productoId: number;
  varianteId?: number | null;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export interface PresupuestoInput {
  clienteId: number;
  descuento: number;
  detalles: DetallePresupuestoInput[];
  expirationMode?: "NONE" | "DEFAULT" | "CUSTOM";
  customExpiration?: string | null;
  recalculationPolicy?: string;
}

async function buildQuotationLines(detalles: DetallePresupuestoInput[]) {
  let subtotal = 0;
  const lines = [];
  for (const item of detalles) {
    const producto = await prisma.producto.findUnique({ where: { id: item.productoId }, include: { variantes: { where: { activa: true, ...(item.varianteId ? { id: item.varianteId } : {}) }, orderBy: { id: "asc" }, include: { unidadBase: true, presentaciones: { where: { activa: true }, include: { unidad: true } } } } } });
    if (!producto) throw new Error(`El producto con ID ${item.productoId} no existe.`);
    const variant = producto.variantes[0];
    if (!variant) throw new Error(`El producto "${producto.nombre}" no tiene una variante activa.`);
    const conversion = calculateProductQuantity(producto, item.cantidad);
    const lineDiscount = Number(item.descuento ?? 0);
    const gross = conversion.actualQuantity * item.precioUnitario;
    const lineTotal = validateQuotationTotals(gross, lineDiscount);
    subtotal += lineTotal;
    const presentation = variant.presentaciones.find((entry) => entry.nombre === conversion.presentationName) ?? variant.presentaciones.find((entry) => entry.predeterminada) ?? null;
    lines.push({ productoId: item.productoId, varianteId: variant.id, presentacionId: presentation?.id, cantidad: conversion.actualQuantity, cantidadSolicitada: conversion.requestedQuantity, cantidadPresentacion: conversion.presentationQuantity, conversionSnapshot: JSON.stringify(conversion), precioUnitario: item.precioUnitario, descuento: lineDiscount, subtotal: lineTotal });
  }
  return { subtotal, lines };
}

export async function crearPresupuesto(input: PresupuestoInput) {
  const actor = await requirePermission(PERMISSIONS.QUOTATIONS_MANAGE);
  const mainBranch = await getMainBranch();
  const configurationSnapshot = await getSystemParameterSnapshot();
  try {
    const { clienteId, descuento, detalles } = input;

    if (!clienteId || detalles.length === 0) {
      return { error: "Faltan datos obligatorios para crear el presupuesto." };
    }

    // 1. Validar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });
    if (!cliente) {
      return { error: "El cliente seleccionado no existe." };
    }

    const { subtotal, lines: detallesToCreate } = await buildQuotationLines(detalles);
    const total = validateQuotationTotals(subtotal, descuento);
    const expiresAt = resolveQuotationExpiration(input.expirationMode ?? "NONE", Number(configurationSnapshot.PRESUPUESTO_VALIDEZ_DIAS ?? 15), input.customExpiration, new Date());

    // 3. Crear el Presupuesto y Detalles
    const presupuesto = await prisma.presupuesto.create({
      data: {
        sucursalId: mainBranch.id,
        clienteId,
        subtotal,
        descuento,
        total,
        validezDias: Number(configurationSnapshot.PRESUPUESTO_VALIDEZ_DIAS ?? 15),
        venceEn: expiresAt,
        politicaRecalculo: normalizeRecalculationPolicy(input.recalculationPolicy ?? "CONSERVAR"),
        configuracionSnapshot: JSON.stringify(configurationSnapshot),
        detalles: {
          create: detallesToCreate,
        },
      },
      include: {
        detalles: {
          include: {
            producto: true, variante: true, presentacion: true,
          },
        },
        cliente: true,
      },
    });
    await recordAudit({ userId: actor.id, action: "PRESUPUESTO_CREADO", entity: "Presupuesto", entityId: presupuesto.id, after: presupuesto });

    revalidatePath("/presupuestos");
    return { success: true, presupuesto };
  } catch (error: any) {
    return { error: error.message || "Error al crear el presupuesto." };
  }
}

export async function actualizarPresupuesto(id: number, input: PresupuestoInput) {
  const actor = await requirePermission(PERMISSIONS.QUOTATIONS_MANAGE);
  const configurationSnapshot = await getSystemParameterSnapshot();
  try {
    const before = await prisma.presupuesto.findUniqueOrThrow({ where: { id }, include: { detalles: true, reservas: { where: { estado: { in: ["ACTIVA", "PARCIALMENTE_CONSUMIDA"] } } } } });
    if (!canEditQuotation(before.estado)) return { error: "Solo se puede editar un presupuesto abierto." };
    if (before.reservas.length) return { error: "Libere las reservas activas antes de modificar las líneas." };
    const { subtotal, lines } = await buildQuotationLines(input.detalles);
    const total = validateQuotationTotals(subtotal, input.descuento);
    const expiresAt = resolveQuotationExpiration(input.expirationMode ?? "NONE", Number(configurationSnapshot.PRESUPUESTO_VALIDEZ_DIAS ?? 15), input.customExpiration, new Date());
    const updated = await prisma.$transaction(async (tx) => {
      await tx.detallePresupuesto.deleteMany({ where: { presupuestoId: id } });
      const result = await tx.presupuesto.update({ where: { id }, data: { clienteId: input.clienteId, subtotal, descuento: input.descuento, total, venceEn: expiresAt, politicaRecalculo: normalizeRecalculationPolicy(input.recalculationPolicy ?? "CONSERVAR"), configuracionSnapshot: JSON.stringify(configurationSnapshot), detalles: { create: lines } }, include: { detalles: { include: { producto: true, variante: true, presentacion: true } }, cliente: true } });
      await recordAudit({ userId: actor.id, action: "PRESUPUESTO_ACTUALIZADO", entity: "Presupuesto", entityId: id, before, after: result }, tx); return result;
    });
    revalidatePath("/presupuestos"); return { success: true, presupuesto: updated };
  } catch (error: unknown) { return { error: error instanceof Error ? error.message : "Error al actualizar el presupuesto." }; }
}

export async function recalcularPresupuesto(id: number) {
  const actor = await requirePermission(PERMISSIONS.QUOTATIONS_MANAGE);
  try {
    const before = await prisma.presupuesto.findUniqueOrThrow({ where: { id }, include: { detalles: { include: { variante: true } }, reservas: { where: { estado: { in: ["ACTIVA", "PARCIALMENTE_CONSUMIDA"] } } } } });
    if (!canEditQuotation(before.estado)) return { error: "Solo se puede recalcular un presupuesto abierto." };
    const { subtotal, lines } = await buildQuotationLines(before.detalles.map((detail) => ({ productoId: detail.productoId, varianteId: detail.varianteId, cantidad: detail.cantidadSolicitada ?? detail.cantidad, precioUnitario: detail.variante?.precioVenta ?? detail.precioUnitario, descuento: detail.descuento })));
    const total = validateQuotationTotals(subtotal, before.descuento);
    const previousSnapshot = { subtotal: before.subtotal, total: before.total, lines: before.detalles.map((detail) => ({ variantId: detail.varianteId, quantity: detail.cantidad, presentationQuantity: detail.cantidadPresentacion, price: detail.precioUnitario, subtotal: detail.subtotal })) };
    const currentSnapshot = { subtotal, total, lines: lines.map((line) => ({ variantId: line.varianteId, quantity: line.cantidad, presentationQuantity: line.cantidadPresentacion, price: line.precioUnitario, subtotal: line.subtotal })) };
    if (!quotationValuesChanged(previousSnapshot, currentSnapshot)) return { success: true, changed: false };
    if (before.reservas.length) return { error: "Existe una variación, pero primero debe liberar la reserva activa." };
    const updated = await prisma.$transaction(async (tx) => { await tx.detallePresupuesto.deleteMany({ where: { presupuestoId: id } }); const result = await tx.presupuesto.update({ where: { id }, data: { subtotal, total, detalles: { create: lines } }, include: { detalles: { include: { producto: true, variante: true, presentacion: true } }, cliente: true } }); await recordAudit({ userId: actor.id, action: "PRESUPUESTO_RECALCULADO", entity: "Presupuesto", entityId: id, before, after: result }, tx); return result; });
    revalidatePath("/presupuestos"); return { success: true, changed: true, presupuesto: updated };
  } catch (error: unknown) { return { error: error instanceof Error ? error.message : "No se pudo recalcular el presupuesto." }; }
}

export async function eliminarPresupuesto(id: number) {
  const actor = await requirePermission(PERMISSIONS.QUOTATIONS_MANAGE);
  try {
    const before = await prisma.presupuesto.findUniqueOrThrow({ where: { id }, include: { reservas: true } });
    if (!canEditQuotation(before.estado)) return { error: "El presupuesto ya fue convertido o cancelado." };
    if (before.reservas.some((reservation) => ["ACTIVA", "PARCIALMENTE_CONSUMIDA"].includes(reservation.estado))) return { error: "Libere la reserva activa antes de cancelar." };
    const after = await prisma.presupuesto.update({ where: { id }, data: { estado: "CANCELADO" } });
    await recordAudit({ userId: actor.id, action: "PRESUPUESTO_CANCELADO", entity: "Presupuesto", entityId: id, before, after });

    revalidatePath("/presupuestos");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el presupuesto." };
  }
}
