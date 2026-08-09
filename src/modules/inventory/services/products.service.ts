import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/services/access.service";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { readVariantValues, validateVariantValues } from "@/modules/inventory/domain/product-variant";
import { parseProductImageUrls } from "@/modules/inventory/domain/product-image";
import { SALE_POLICIES, validatePresentation } from "@/modules/inventory/domain/unit";

async function resolveClassifications(categoriaId: number, marca: string | null) {
  const category = await prisma.categoria.findUniqueOrThrow({ where: { id: categoriaId } });
  const brand = marca
    ? await prisma.marca.upsert({ where: { nombre: marca }, update: {}, create: { nombre: marca } })
    : null;
  return { familiaId: category.familiaId, marcaId: brand?.id ?? null };
}

async function resolveVariantValues(categoriaId: number, formData: FormData) {
  const category = await prisma.categoria.findUnique({ where: { id: categoriaId }, include: { familia: { include: { atributos: { where: { activo: true } } } } } });
  const definitions = category?.familia?.atributos ?? [];
  const values = readVariantValues(formData);
  const errors = validateVariantValues(definitions, values);
  if (errors.length) throw new Error(errors.join(" "));
  return [...values].filter(([id]) => definitions.some((item) => item.id === id)).map(([atributoId, valor]) => ({ atributoId, valor }));
}

async function resolveCommerce(categoriaId: number, formData: FormData) {
  const unidadBaseId = Number(formData.get("unidadBaseId"));
  const unit = await prisma.unidadMedida.findUnique({ where: { id: unidadBaseId } });
  if (!unit?.activa) throw new Error("La unidad base seleccionada no está disponible.");
  const category = await prisma.categoria.findUnique({ where: { id: categoriaId }, include: { familia: true } });
  const requestedPolicy = String(formData.get("politicaVenta") ?? "");
  const politicaVenta = SALE_POLICIES.includes(requestedPolicy as (typeof SALE_POLICIES)[number])
    ? requestedPolicy
    : category?.familia?.nombre === "Pisos" ? "SOLO_CAJAS_COMPLETAS" : "UNIDADES_ENTERAS";
  const multiploRaw = Number(formData.get("multiploVenta"));
  const multiploVenta = politicaVenta === "MULTIPLO_CONFIGURABLE" ? multiploRaw : null;
  if (politicaVenta === "MULTIPLO_CONFIGURABLE" && (multiploVenta == null || !Number.isFinite(multiploVenta) || multiploVenta <= 0)) throw new Error("Debe indicar un múltiplo de venta positivo.");
  const presentationFactor = Number(formData.get("factorPresentacion") || formData.get("m2PorCaja"));
  const presentationUnitId = Number(formData.get("unidadPresentacionId"));
  const presentationName = String(formData.get("nombrePresentacion") ?? "").trim();
  const piecesRaw = String(formData.get("piezasPresentacion") ?? "").trim();
  const pieces = piecesRaw ? Number(piecesRaw) : null;
  const presentations: { unidadId: number; nombre: string; factorConversion: number; piezas?: number; descripcion?: string; predeterminada: boolean }[] = [{ unidadId: unidadBaseId, nombre: unit.nombre, factorConversion: 1, predeterminada: true }];
  if (presentationName) {
    validatePresentation({ factorConversion: presentationFactor, piezas: pieces });
    const presentationUnit = await prisma.unidadMedida.findUnique({ where: { id: presentationUnitId } });
    if (!presentationName || !presentationUnit?.activa) throw new Error("La presentación y su unidad son obligatorias.");
    if (presentationName !== unit.nombre || presentationUnitId !== unidadBaseId) presentations.push({ unidadId: presentationUnitId, nombre: presentationName, factorConversion: presentationFactor, piezas: pieces ?? undefined, descripcion: String(formData.get("descripcionPresentacion") ?? "").trim() || undefined, predeterminada: false });
  }
  return { unit, unidadBaseId, politicaVenta, multiploVenta, presentations };
}

export async function createProducto(formData: FormData) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  try {
    const codigo = (formData.get("codigo") as string)?.trim();
    const codigoBarras = (formData.get("codigoBarras") as string)?.trim() || null;
    const nombre = (formData.get("nombre") as string)?.trim();
    const descripcion = (formData.get("descripcion") as string)?.trim() || null;
    const marca = (formData.get("marca") as string)?.trim() || null;
    const categoriaId = parseInt(formData.get("categoriaId") as string);
    const commerce = await resolveCommerce(categoriaId, formData);
    const unidadVenta = commerce.unit.codigo;
    const permitsFraccion = ["CAJAS_Y_FRACCION", "CANTIDAD_EXACTA"].includes(commerce.politicaVenta);
    const m2PorCajaRaw = formData.get("m2PorCaja") as string;
    const m2PorCaja = m2PorCajaRaw ? parseFloat(m2PorCajaRaw) : null;
    
    const precioCompra = parseFloat(formData.get("precioCompra") as string);
    const precioVenta = parseFloat(formData.get("precioVenta") as string);
    const stockMinimoRaw = formData.get("stockMinimo") as string;
    const stockMinimo = stockMinimoRaw ? parseFloat(stockMinimoRaw) : 0;
    const images = parseProductImageUrls(formData.get("imagenes") as string);
    const imagenUrl = images[0]?.url ?? null;

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

    const classifications = await resolveClassifications(categoriaId, marca);
    const variantValues = await resolveVariantValues(categoriaId, formData);
    await prisma.producto.create({
      data: {
        codigo,
        codigoBarras,
        nombre,
        descripcion,
        marca,
        categoriaId,
        ...classifications,
        unidadVenta,
        m2PorCaja,
        permiteFraccion: permitsFraccion,
        precioCompra,
        precioVenta,
        stockMinimo,
        imagenUrl,
        imagenes: { create: images },
        variantes: { create: { sku: codigo, codigoBarras, precioCompra, precioVenta, unidadBaseId: commerce.unidadBaseId, politicaVenta: commerce.politicaVenta, multiploVenta: commerce.multiploVenta, valores: { create: variantValues }, presentaciones: { create: commerce.presentations } } },
      },
    });

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al crear el producto." };
  }
}

export async function updateProducto(id: number, formData: FormData) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  try {
    const codigo = (formData.get("codigo") as string)?.trim();
    const codigoBarras = (formData.get("codigoBarras") as string)?.trim() || null;
    const nombre = (formData.get("nombre") as string)?.trim();
    const descripcion = (formData.get("descripcion") as string)?.trim() || null;
    const marca = (formData.get("marca") as string)?.trim() || null;
    const categoriaId = parseInt(formData.get("categoriaId") as string);
    const commerce = await resolveCommerce(categoriaId, formData);
    const unidadVenta = commerce.unit.codigo;
    const permitsFraccion = ["CAJAS_Y_FRACCION", "CANTIDAD_EXACTA"].includes(commerce.politicaVenta);
    const m2PorCajaRaw = formData.get("m2PorCaja") as string;
    const m2PorCaja = m2PorCajaRaw ? parseFloat(m2PorCajaRaw) : null;
    
    const precioCompra = parseFloat(formData.get("precioCompra") as string);
    const precioVenta = parseFloat(formData.get("precioVenta") as string);
    const stockMinimoRaw = formData.get("stockMinimo") as string;
    const stockMinimo = stockMinimoRaw ? parseFloat(stockMinimoRaw) : 0;
    const images = parseProductImageUrls(formData.get("imagenes") as string);
    const imagenUrl = images[0]?.url ?? null;

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

    const classifications = await resolveClassifications(categoriaId, marca);
    const variantValues = await resolveVariantValues(categoriaId, formData);
    const primaryVariant = await prisma.varianteProducto.findFirst({ where: { productoId: id }, orderBy: { id: "asc" } });
    await prisma.$transaction(async (tx) => {
      await tx.producto.update({ where: { id }, data: {
        codigo,
        codigoBarras,
        nombre,
        descripcion,
        marca,
        categoriaId,
        ...classifications,
        unidadVenta,
        m2PorCaja,
        permiteFraccion: permitsFraccion,
        precioCompra,
        precioVenta,
        stockMinimo,
        imagenUrl,
        imagenes: { deleteMany: {}, create: images },
      } });
      if (primaryVariant) {
        await tx.varianteProducto.update({
          where: { id: primaryVariant.id },
          data: { sku: codigo, codigoBarras, precioCompra, precioVenta, unidadBaseId: commerce.unidadBaseId, politicaVenta: commerce.politicaVenta, multiploVenta: commerce.multiploVenta, valores: { deleteMany: {}, create: variantValues }, presentaciones: { deleteMany: {}, create: commerce.presentations } },
        });
      } else {
        await tx.varianteProducto.create({
          data: { productoId: id, sku: codigo, codigoBarras, precioCompra, precioVenta, unidadBaseId: commerce.unidadBaseId, politicaVenta: commerce.politicaVenta, multiploVenta: commerce.multiploVenta, valores: { create: variantValues }, presentaciones: { create: commerce.presentations } },
        });
      }
    });

    revalidatePath("/inventario");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el producto." };
  }
}

export async function deleteProducto(id: number) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
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
