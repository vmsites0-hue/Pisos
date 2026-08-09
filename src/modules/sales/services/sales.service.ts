import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hasPermission, requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { getSystemParameterSnapshot } from "@/modules/settings/services/system-parameters.service";
import { calculateProductQuantity } from "@/modules/inventory/domain/quantity-conversion";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { randomUUID } from "node:crypto";
import { syncMinimumStockAlert } from "@/modules/inventory/services/minimum-stock.service";
import { syncPhysicalPackaging } from "@/modules/inventory/services/open-presentations.service";
import { validateQuotationConversion } from "@/modules/quotations/domain/quotation-conversion";
import { evaluateCommercialException } from "@/modules/discounts/domain/commercial-exception";
import { requestApproval } from "@/modules/approvals/services/approvals.service";
import { validateSaleContract } from "@/modules/sales/domain/sale-validation";
import { calcularDescuentoAutomatico } from "@/modules/discounts/services/discounts.service";
import { buildDeliverySnapshot } from "@/modules/sales/domain/delivery";

export interface DetalleVentaInput {
  productoId: number;
  varianteId?: number | null;
  loteTono: string | null;
  cantidad: number;
  precioUnitario: number;
  inventarioId?: number | null;
  lineaReservaId?: number | null;
  precioOriginal?: number;
}

export interface VentaInput {
  sucursalId: number;
  clienteId: number;
  descuento: number;
  metodoPago: string;
  tipoEntrega?: string; // ENVIO o RETIRO
  detalles: DetalleVentaInput[];
  reservaId?: number | null;
  presupuestoId?: number | null;
  reglaDescuentoId?: number | null;
  descuentoAutomatico?: number;
  approvalId?: number | null;
  exceptionReason?: string;
}

export async function procesarVenta(input: VentaInput) {
  const authenticatedUser = await requirePermission(PERMISSIONS.SALES_CREATE);
  const mainBranch = await getMainBranch();
  const configurationSnapshot = await getSystemParameterSnapshot();
  const operationReference = randomUUID();

  try {
    const { clienteId, descuento: requestedDiscount, metodoPago, tipoEntrega = "ENVIO", detalles, reservaId, presupuestoId, descuentoAutomatico: clientAutomaticDiscount = 0 } = input;
    const sucursalId = mainBranch.id;
    validateSaleContract({ clienteId, metodoPago, tipoEntrega, detalles });

    const referencePrices = await Promise.all(detalles.map(async (item) => {
      const product = await prisma.producto.findUnique({ where: { id: item.productoId }, include: { variantes: { where: { activa: true, ...(item.varianteId ? { id: item.varianteId } : {}) }, orderBy: { id: "asc" }, take: 1 } } });
      const variant = product?.variantes[0];
      return { ...item, categoriaId: product?.categoriaId ?? 0, familiaId: product?.familiaId, marcaId: product?.marcaId, precioOriginal: variant?.precioVenta ?? item.precioUnitario };
    }));
    const estimatedSubtotal = referencePrices.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
    const manualDiscount = Math.max(0, requestedDiscount - clientAutomaticDiscount);
    const serverPromotion = await calcularDescuentoAutomatico(referencePrices.map((item) => ({ productoId: item.productoId, varianteId: item.varianteId, categoriaId: item.categoriaId, familiaId: item.familiaId, marcaId: item.marcaId, cantidad: item.cantidad, precioUnitario: item.precioUnitario, subtotal: item.cantidad * item.precioUnitario })), clienteId);
    const descuentoAutomatico = serverPromotion.monto;
    const reglaDescuentoId = serverPromotion.reglaAplicadaId;
    const descuento = manualDiscount + descuentoAutomatico;
    const limit = Number(configurationSnapshot.DESCUENTO_MANUAL_LIMITE_PORCENTAJE ?? 5);
    const canManageDiscounts = await hasPermission(PERMISSIONS.DISCOUNTS_MANAGE);
    const exception = evaluateCommercialException({ subtotal: estimatedSubtotal, manualDiscount, discountLimitPercent: limit, hasDiscountPermission: canManageDiscounts, hasManualPriceChange: referencePrices.some((item) => Math.abs(item.precioOriginal - item.precioUnitario) > 0.000001), hasPricePermission: canManageDiscounts });
    let approvedRequest: { id: number; aprobadorId: number | null } | null = null;
    if (exception.approvalType) {
      if (!input.approvalId) {
        const request = await requestApproval({ type: exception.approvalType, reason: input.exceptionReason?.trim() || "Excepción comercial solicitada al confirmar la venta", entity: "Venta", previousValues: { prices: referencePrices.map((item) => item.precioOriginal), discount: descuentoAutomatico }, proposedValues: { prices: referencePrices.map((item) => item.precioUnitario), discount: descuento, discountPercent: exception.discountPercent } });
        return { error: "La excepción comercial requiere aprobación.", approvalRequestId: request.id };
      }
      approvedRequest = await prisma.solicitudAprobacion.findFirst({ where: { id: input.approvalId, solicitanteId: authenticatedUser.id, tipo: exception.approvalType, estado: "APROBADA", ejecutadoEn: null }, select: { id: true, aprobadorId: true } });
      if (!approvedRequest) return { error: "La aprobación comercial no es válida, no está aprobada o ya fue utilizada." };
    }

    if (!clienteId || !metodoPago || detalles.length === 0) {
      return { error: "Faltan datos obligatorios para procesar la venta." };
    }

    const usuarioId = authenticatedUser.id;

    // Ejecutar transacción
    const ventaProcesada = await prisma.$transaction(async (tx) => {
      // 1. Validar cliente
      const cliente = await tx.cliente.findUnique({
        where: { id: clienteId },
      });
      if (!cliente || !cliente.activo) {
        throw new Error("El cliente seleccionado no existe.");
      }

      const quotation = presupuestoId ? await tx.presupuesto.findUnique({ where: { id: presupuestoId }, include: { venta: { select: { id: true } } } }) : null;
      if (presupuestoId && !quotation) throw new Error("El presupuesto indicado no existe.");
      if (quotation) {
        const conversionError = validateQuotationConversion({ estado: quotation.estado, venceEn: quotation.venceEn, ventaId: quotation.venta?.id });
        if (conversionError) throw new Error(conversionError);
        if (quotation.clienteId !== clienteId || quotation.sucursalId !== sucursalId) throw new Error("El presupuesto no corresponde al cliente o sucursal de la venta.");
      }

      let subtotal = 0;
      const detallesToCreate = [];
      const reservation = reservaId ? await tx.reservaStock.findUnique({ where: { id: reservaId }, include: { lineas: true } }) : null;
      if (reservaId && (!reservation || reservation.estado !== "ACTIVA" || (reservation.venceEn && reservation.venceEn <= new Date()))) throw new Error("La reserva está vencida, liberada o ya fue utilizada.");

      // 2. Procesar ítems del carrito
      for (const item of detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
          include: { variantes: { where: { activa: true, ...(item.varianteId ? { id: item.varianteId } : {}) }, orderBy: { id: "asc" }, include: { unidadBase: true, presentaciones: { where: { activa: true }, include: { unidad: true } } } } },
        });
        if (!producto) {
          throw new Error(`El producto con ID ${item.productoId} no existe.`);
        }
        const variant = item.varianteId ? producto.variantes.find((candidate) => candidate.id === item.varianteId) : producto.variantes[0];
        if (!variant) throw new Error(`La variante indicada para "${producto.nombre}" no existe o está inactiva.`);

        // Buscar stock en inventario por sucursal y lote/tono
        const inv = item.inventarioId ? await tx.inventario.findFirst({ where: { id: item.inventarioId,
            productoId: item.productoId,
            varianteId: variant.id,
            sucursalId,
          } }) : await tx.inventario.findFirst({ where: { productoId: item.productoId, varianteId: variant.id, sucursalId, loteTono: item.loteTono || null } });

        const conversion = calculateProductQuantity(producto, item.cantidad);
        const reservedLine = item.lineaReservaId ? reservation?.lineas.find((line) => line.id === item.lineaReservaId && line.inventarioId === inv?.id && line.estado === "ACTIVA") : null;
        if (item.lineaReservaId && (!reservedLine || Math.abs(reservedLine.cantidad - conversion.actualQuantity) > 0.000001)) throw new Error("La línea reservada no es válida o su cantidad cambió.");
        const stockActual = inv ? inv.stockActual : 0;
        const stockDisponible = reservedLine ? stockActual : stockActual - (inv?.stockReservado ?? 0);
        if (stockDisponible < conversion.actualQuantity) {
          throw new Error(
            `Stock insuficiente para el producto "${producto.nombre}" [Lote: ${item.loteTono || "Sin especificar"}]. ` +
            `Disponible: ${stockDisponible} ${producto.unidadVenta}, Requerido real: ${conversion.actualQuantity} ${producto.unidadVenta}`
          );
        }

        // Descontar del inventario
        await tx.inventario.update({
          where: { id: inv!.id },
          data: {
            stockActual: {
              decrement: conversion.actualQuantity,
            },
            ...(reservedLine ? { stockReservado: { decrement: conversion.actualQuantity } } : {}),
          },
        });
        if (reservedLine) await tx.lineaReservaStock.update({ where: { id: reservedLine.id }, data: { estado: "CONSUMIDA" } });
        await recordInventoryMovement(tx, { inventoryId: inv!.id, variantId: variant.id, userId: usuarioId, type: "VENTA", quantity: -conversion.actualQuantity, baseUnit: variant.unidadBase?.codigo ?? producto.unidadVenta, previousBalance: stockActual, resultingBalance: stockActual - conversion.actualQuantity, reason: `Venta confirmada para cliente ${clienteId}`, referenceType: "VENTA", referenceId: operationReference });
        await syncPhysicalPackaging(tx, { inventoryId: inv!.id, previousStock: stockActual, userId: usuarioId, reason: `Consumo por venta para cliente ${clienteId}`, referenceType: "VENTA", referenceId: operationReference });
        await syncMinimumStockAlert(tx, inv!.id, usuarioId);

        const itemSubtotal = conversion.actualQuantity * item.precioUnitario;
        subtotal += itemSubtotal;

        detallesToCreate.push({
          productoId: item.productoId,
          varianteId: variant.id,
          cantidad: conversion.actualQuantity,
          cantidadSolicitada: conversion.requestedQuantity,
          cantidadPresentacion: conversion.presentationQuantity,
          conversionSnapshot: JSON.stringify(conversion),
          precioUnitario: item.precioUnitario,
          precioOriginal: referencePrices.find((reference) => reference.productoId === item.productoId && reference.varianteId === item.varianteId)?.precioOriginal ?? item.precioUnitario,
          productoSnapshot: JSON.stringify({ codigo: producto.codigo, nombre: producto.nombre, sku: variant.sku, unidad: variant.unidadBase?.codigo ?? producto.unidadVenta, presentacion: conversion.presentationName, factorConversion: conversion.conversionFactor }),
          impuesto: itemSubtotal * Number(configurationSnapshot.IMPUESTO_PORCENTAJE ?? 0) / (100 + Number(configurationSnapshot.IMPUESTO_PORCENTAJE ?? 0)),
          moneda: String(configurationSnapshot.MONEDA ?? "PYG"),
          subtotal: itemSubtotal,
        });
      }

      const total = subtotal - descuento;
      if (total < 0) {
        throw new Error("El total de la venta no puede ser menor a 0.");
      }

      // 3. Validar línea de crédito del cliente si paga con CREDITO
      if (metodoPago === "CREDITO") {
        if (cliente.limiteCredito <= 0) {
          throw new Error("El cliente no tiene autorizada una línea de crédito.");
        }
        const nuevoSaldo = cliente.saldoDeudor + total;
        if (nuevoSaldo > cliente.limiteCredito) {
          throw new Error(
            `Límite de crédito excedido. Límite: Gs. ${cliente.limiteCredito.toLocaleString("es-PY")}, ` +
            `Saldo Deudor actual: Gs. ${cliente.saldoDeudor.toLocaleString("es-PY")}, Compra: Gs. ${total.toLocaleString("es-PY")}`
          );
        }

        // Incrementar saldo deudor
        await tx.cliente.update({
          where: { id: clienteId },
          data: {
            saldoDeudor: {
              increment: total,
            },
          },
        });
      }

      // El estado inicial si es Retiro en Local es ENTREGADO directamente. Si es ENVIO, es PENDIENTE.
      const estadoInicial = tipoEntrega === "RETIRO" ? "ENTREGADO" : "PENDIENTE";
      const delivery = buildDeliverySnapshot({ deliveryType: tipoEntrega, customer: cliente });

      // 4. Crear la Venta y sus Detalles
      const venta = await tx.venta.create({
        data: {
          sucursalId,
          usuarioId,
          clienteId,
          presupuestoId,
          reglaDescuentoId,
          descuentoAutomatico,
          subtotal,
          descuento,
          total,
          estado: estadoInicial,
          metodoPago,
          tipoEntrega,
          configuracionSnapshot: JSON.stringify(configurationSnapshot),
          excepcionComercialSnapshot: JSON.stringify({ manualDiscount, limitPercent: limit, reason: input.exceptionReason ?? null, requesterId: authenticatedUser.id, approverId: approvedRequest?.aprobadorId ?? null }),
          detalles: {
            create: detallesToCreate,
          },
          ...(delivery ? { entrega: { create: delivery } } : {}),
        },
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
          cliente: true,
          sucursal: true,
          entrega: true,
        },
      });
      if (reservation) {
        const activeLines = await tx.lineaReservaStock.count({ where: { reservaId: reservation.id, estado: "ACTIVA" } });
        await tx.reservaStock.update({ where: { id: reservation.id }, data: { estado: activeLines === 0 ? "CONSUMIDA" : "PARCIALMENTE_CONSUMIDA" } });
      }
      if (quotation) await tx.presupuesto.update({ where: { id: quotation.id }, data: { estado: "CONVERTIDO" } });
      if (approvedRequest) {
        const consumed = await tx.solicitudAprobacion.updateMany({ where: { id: approvedRequest.id, estado: "APROBADA", ejecutadoEn: null }, data: { estado: "EJECUTADA", ejecutadoEn: new Date() } });
        if (consumed.count !== 1) throw new Error("La aprobación comercial ya fue utilizada.");
      }
      await tx.movimientoInventario.updateMany({ where: { referenciaTipo: "VENTA", referenciaId: operationReference, usuarioId }, data: { referenciaId: venta.id.toString() } });

      await recordAudit({
        userId: usuarioId,
        action: "VENTA_CONFIRMADA",
        entity: "Venta",
        entityId: venta.id,
        after: { clienteId, subtotal, descuento, total, metodoPago, tipoEntrega, detalles, reservaId, presupuestoId },
      }, tx);

      return venta;
    });

    revalidatePath("/ventas");
    revalidatePath("/inventario");
    revalidatePath("/clientes");
    revalidatePath("/presupuestos");
    return { success: true, venta: ventaProcesada };
  } catch (error: any) {
    return { error: error.message || "Error al procesar la venta." };
  }
}
