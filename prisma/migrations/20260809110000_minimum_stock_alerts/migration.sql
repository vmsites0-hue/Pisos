ALTER TABLE "VarianteProducto" ADD COLUMN "stockMinimo" REAL NOT NULL DEFAULT 0;
UPDATE "VarianteProducto" SET "stockMinimo" = (SELECT "stockMinimo" FROM "Producto" WHERE "Producto"."id" = "VarianteProducto"."productoId");
ALTER TABLE "Inventario" ADD COLUMN "alertaMinimoActiva" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Inventario" ADD COLUMN "alertaMinimoSecuencia" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Notificacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" TEXT,
    "claveIdempotencia" TEXT NOT NULL,
    "leidaEn" DATETIME,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Notificacion_claveIdempotencia_key" ON "Notificacion"("claveIdempotencia");
CREATE INDEX "Notificacion_usuarioId_leidaEn_creadaEn_idx" ON "Notificacion"("usuarioId", "leidaEn", "creadaEn");
