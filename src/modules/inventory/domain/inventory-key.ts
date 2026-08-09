export function normalizeInventoryDimension(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized || null;
}

export function inventoryDimensionsEqual(a: { lote: string | null; tono: string | null; calibre: string | null }, b: { lote: string | null; tono: string | null; calibre: string | null }) {
  return a.lote === b.lote && a.tono === b.tono && a.calibre === b.calibre;
}
