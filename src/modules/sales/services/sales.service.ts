import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";

export interface DetalleVentaInput {
  productoId: number;
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

  try {
    const { sucursalId, clienteId, descuento, metodoPago, tipoEntrega = "ENVIO", detalles } = input;

    if (!sucursalId || !clienteId || !metodoPago || detalles.length === 0) {
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
        });
        if (!producto) {
          throw new Error(`El producto con ID ${item.productoId} no existe.`);
        }

        // Buscar stock en inventario por sucursal y lote/tono
        const inv = await tx.inventario.findFirst({
          where: {
            productoId: item.productoId,
            sucursalId,
            loteTono: item.loteTono || null,
          },
        });

        const stockActual = inv ? inv.stockActual : 0;
        if (stockActual < item.cantidad) {
          throw new Error(
            `Stock insuficiente para el producto "${producto.nombre}" [Lote: ${item.loteTono || "Sin especificar"}]. ` +
            `Disponible: ${stockActual} ${producto.unidadVenta}, Requerido: ${item.cantidad} ${producto.unidadVenta}`
          );
        }

        // Descontar del inventario
        await tx.inventario.update({
          where: { id: inv!.id },
          data: {
            stockActual: {
              decrement: item.cantidad,
            },
          },
        });

        const itemSubtotal = item.cantidad * item.precioUnitario;
        subtotal += itemSubtotal;

        detallesToCreate.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
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
