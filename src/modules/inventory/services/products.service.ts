import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProducto(formData: FormData) {
  try {
    const codigo = (formData.get("codigo") as string)?.trim();
    const codigoBarras = (formData.get("codigoBarras") as string)?.trim() || null;
    const nombre = (formData.get("nombre") as string)?.trim();
    const descripcion = (formData.get("descripcion") as string)?.trim() || null;
    const marca = (formData.get("marca") as string)?.trim() || null;
    const categoriaId = parseInt(formData.get("categoriaId") as string);
    const unidadVenta = formData.get("unidadVenta") as string;
    const permitsFraccion = formData.get("permiteFraccion") === "true";
    const m2PorCajaRaw = formData.get("m2PorCaja") as string;
    const m2PorCaja = m2PorCajaRaw ? parseFloat(m2PorCajaRaw) : null;
    
    const precioCompra = parseFloat(formData.get("precioCompra") as string);
    const precioVenta = parseFloat(formData.get("precioVenta") as string);
    const stockMinimoRaw = formData.get("stockMinimo") as string;
    const stockMinimo = stockMinimoRaw ? parseFloat(stockMinimoRaw) : 0;
    const imagenUrl = (formData.get("imagenUrl") as string)?.trim() || null;

    if (!codigo || !nombre || isNaN(categoriaId) || isNaN(precioCompra) || isNaN(precioVenta)) {
      return { error: "Faltan campos obligatorios o los datos son inválidos." };
    }

    // Verificar unicidad de código
    const existeCodigo = await prisma.producto.findUnique({
      where: { codigo },
    });
    if (existeCodigo) {
      return { error: `El código de producto '${codigo}' ya está registrado.` };
    }

    // Verificar unicidad de código de barras
    if (codigoBarras) {
      const existeCodigoBarras = await prisma.producto.findUnique({
        where: { codigoBarras },
      });
      if (existeCodigoBarras) {
        return { error: `El código de barras '${codigoBarras}' ya está registrado.` };
      }
    }

    await prisma.producto.create({
      data: {
        codigo,
        codigoBarras,
        nombre,
        descripcion,
        marca,
        categoriaId,
        unidadVenta,
        m2PorCaja,
        permiteFraccion: permitsFraccion,
        precioCompra,
        precioVenta,
        stockMinimo,
        imagenUrl,
      },
    });

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al crear el producto." };
  }
}

export async function updateProducto(id: number, formData: FormData) {
  try {
    const codigo = (formData.get("codigo") as string)?.trim();
    const codigoBarras = (formData.get("codigoBarras") as string)?.trim() || null;
    const nombre = (formData.get("nombre") as string)?.trim();
    const descripcion = (formData.get("descripcion") as string)?.trim() || null;
    const marca = (formData.get("marca") as string)?.trim() || null;
    const categoriaId = parseInt(formData.get("categoriaId") as string);
    const unidadVenta = formData.get("unidadVenta") as string;
    const permitsFraccion = formData.get("permiteFraccion") === "true";
    const m2PorCajaRaw = formData.get("m2PorCaja") as string;
    const m2PorCaja = m2PorCajaRaw ? parseFloat(m2PorCajaRaw) : null;
    
    const precioCompra = parseFloat(formData.get("precioCompra") as string);
    const precioVenta = parseFloat(formData.get("precioVenta") as string);
    const stockMinimoRaw = formData.get("stockMinimo") as string;
    const stockMinimo = stockMinimoRaw ? parseFloat(stockMinimoRaw) : 0;
    const imagenUrl = (formData.get("imagenUrl") as string)?.trim() || null;

    if (!codigo || !nombre || isNaN(categoriaId) || isNaN(precioCompra) || isNaN(precioVenta)) {
      return { error: "Faltan campos obligatorios o los datos son inválidos." };
    }

    // Verificar unicidad de código (excluyendo el actual)
    const existeCodigo = await prisma.producto.findFirst({
      where: { codigo, NOT: { id } },
    });
    if (existeCodigo) {
      return { error: `El código de producto '${codigo}' ya lo tiene otro producto.` };
    }

    // Verificar unicidad de código de barras (excluyendo el actual)
    if (codigoBarras) {
      const existeCodigoBarras = await prisma.producto.findFirst({
        where: { codigoBarras, NOT: { id } },
      });
      if (existeCodigoBarras) {
        return { error: `El código de barras '${codigoBarras}' ya lo tiene otro producto.` };
      }
    }

    await prisma.producto.update({
      where: { id },
      data: {
        codigo,
        codigoBarras,
        nombre,
        descripcion,
        marca,
        categoriaId,
        unidadVenta,
        m2PorCaja,
        permiteFraccion: permitsFraccion,
        precioCompra,
        precioVenta,
        stockMinimo,
        imagenUrl,
      },
    });

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el producto." };
  }
}

export async function deleteProducto(id: number) {
  try {
    // Verificar si el producto se ha vendido
    const ventasCount = await prisma.detalleVenta.count({
      where: { productoId: id },
    });

    if (ventasCount > 0) {
      return { error: "No se puede eliminar el producto porque ya tiene ventas registradas." };
    }

    // Si tiene inventarios, los eliminamos primero (o bloqueamos)
    // En este caso, eliminamos los registros de inventario ya que no hay ventas y por ende no altera el histórico contable.
    await prisma.inventario.deleteMany({
      where: { productoId: id },
    });

    await prisma.producto.delete({
      where: { id },
    });

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el producto." };
  }
}
