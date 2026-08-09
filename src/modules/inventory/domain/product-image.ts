export function parseProductImageUrls(raw: string | null | undefined) {
  const urls = (raw ?? "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  const unique = [...new Set(urls)];
  for (const url of unique) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error(`La imagen '${url}' no es una URL válida.`); }
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Las imágenes deben usar HTTP o HTTPS.");
  }
  return unique.map((url, orden) => ({ url, orden, principal: orden === 0 }));
}
