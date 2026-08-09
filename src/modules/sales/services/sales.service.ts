import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { recordAudit } from "@/modules/audit/services/audit.service";
import { getMainBranch } from "@/modules/branches/services/main-branch.service";
import { getSystemParameterSnapshot } from "@/modules/settings/services/system-parameters.service";
import { calculateProductQuantity } from "@/modules/inventory/domain/quantity-conversion";
import { recordInventoryMovement } from "@/modules/inventory/services/inventory-movements.service";
import { randomUUID } from "node:crypto";

export interface DetalleVentaInput {
  productoId: number;
  varianteId?: number | null;
  loteTono: string | null;
  cantidad: number;
  precioUnitario: number;
}

export interface VentaInput {
  sucursalId: number;
  clienteId: number;
  descuento: number;
  metodoPago: string;
  tipoEntrega?: string; // ENVIO o RETIRO
  detalles: DetalleVentaInput[];
}

export async function procesarVenta(input: VentaInput) {
  const authenticatedUser = await requirePermission(PERMISSIONS.SALES_CREATE);
  const mainBranch = await getMainBranch();
  const configurationSnapshot = await getSystemParameterSnapshot();
  const operationReference = randomUUID();

  try {
    const { clienteId, descuento, metodoPago, tipoEntrega = "ENVIO", detalles } = input;
    const sucursalId = mainBranch.id;

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
      if (!cliente) {
        throw new Error("El cliente seleccionado no existe.");
      }

      let subtotal = 0;
      const detallesToCreate = [];

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
        const inv = await tx.inventario.findFirst({
          where: {
            productoId: item.productoId,
            varianteId: variant.id,
            sucursalId,
            loteTono: item.loteTono || null,
          },
        });

        const conversion = calculateProductQuantity(producto, item.cantidad);
        const stockActual = inv ? inv.stockActual : 0;
        if (stockActual < conversion.actualQuantity) {
          throw new Error(
            `Stock insuficiente para el producto "${producto.nombre}" [Lote: ${item.loteTono || "Sin especificar"}]. ` +
            `Disponible: ${stockActual} ${producto.unidadVenta}, Requerido real: ${conversion.actualQuantity} ${producto.unidadVenta}`
          );
        }

        // Descontar del inventario
        await tx.inventario.update({
          where: { id: inv!.id },
          data: {
            stockActual: {
              decrement: conversion.actualQuantity,
            },
          },
        });
        await recordInventoryMovement(tx, { inventoryId: inv!.id, variantId: variant.id, userId: usuarioId, type: "VENTA", quantity: -conversion.actualQuantity, baseUnit: variant.unidadBase?.codigo ?? producto.unidadVenta, previousBalance: stockActual, resultingBalance: stockActual - conversion.actualQuantity, reason: `Venta confirmada para cliente ${clienteId}`, referenceType: "VENTA", referenceId: operationReference });

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

      // 4. Crear la Venta y sus Detalles
      const venta = await tx.venta.create({
        data: {
          sucursalId,
          usuarioId,
          clienteId,
          subtotal,
          descuento,
          total,
          estado: estadoInicial,
          metodoPago,
          tipoEntrega,
          configuracionSnapshot: JSON.stringify(configurationSnapshot),
          detalles: {
            create: detallesToCreate,
          },
        },
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
          cliente: true,
          sucursal: true,
        },
      });
      await tx.movimientoInventario.updateMany({ where: { referenciaTipo: "VENTA", referenciaId: operationReference, usuarioId }, data: { referenciaId: venta.id.toString() } });

      await recordAudit({
        userId: usuarioId,
        action: "VENTA_CONFIRMADA",
        entity: "Venta",
        entityId: venta.id,
        after: { clienteId, subtotal, descuento, total, metodoPago, tipoEntrega, detalles },
      }, tx);

      return venta;
    });

    revalidatePath("/ventas");
    revalidatePath("/inventario");
    revalidatePath("/clientes");
    return { success: true, venta: ventaProcesada };
  } catch (error: any) {
    return { error: error.message || "Error al procesar la venta." };
  }
}
