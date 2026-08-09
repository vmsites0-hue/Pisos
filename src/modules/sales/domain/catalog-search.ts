export type CatalogSearchItem = { producto: { codigo: string; codigoBarras?: string | null; nombre: string; marca?: string | null; marcaCatalogo?: { nombre: string } | null }; variante?: { sku: string; codigoBarras?: string | null; valores?: Array<{ valor: string }> } | null; loteTono?: string | null; lote?: string | null; tono?: string | null };

export function matchesCatalogQuery(item: CatalogSearchItem, rawQuery: string) {
  const query = rawQuery.trim().toLocaleLowerCase("es");
  if (!query) return true;
  return [item.producto.codigo, item.producto.codigoBarras, item.producto.nombre, item.producto.marca, item.producto.marcaCatalogo?.nombre, item.variante?.sku, item.variante?.codigoBarras, item.loteTono, item.lote, item.tono, ...(item.variante?.valores?.map((entry) => entry.valor) ?? [])].filter(Boolean).some((value) => String(value).toLocaleLowerCase("es").includes(query));
}

export function availableStock(stockActual: number, stockReservado: number) {
  return Math.max(0, stockActual - stockReservado);
}
