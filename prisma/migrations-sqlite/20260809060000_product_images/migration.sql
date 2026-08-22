CREATE TABLE "ProductoImagen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productoId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "textoAlt" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProductoImagen_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProductoImagen_productoId_url_key" ON "ProductoImagen"("productoId", "url");
CREATE INDEX "ProductoImagen_productoId_orden_idx" ON "ProductoImagen"("productoId", "orden");

INSERT INTO "ProductoImagen" ("productoId", "url", "orden", "principal")
SELECT "id", "imagenUrl", 0, true FROM "Producto" WHERE "imagenUrl" IS NOT NULL AND TRIM("imagenUrl") <> '';
