CREATE TABLE "VarianteProducto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productoId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "nombre" TEXT,
    "precioCompra" REAL NOT NULL,
    "precioVenta" REAL NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" DATETIME NOT NULL,
    CONSTRAINT "VarianteProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VarianteAtributoValor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "varianteId" INTEGER NOT NULL,
    "atributoId" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,
    CONSTRAINT "VarianteAtributoValor_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VarianteAtributoValor_atributoId_fkey" FOREIGN KEY ("atributoId") REFERENCES "AtributoFamilia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "VarianteProducto_sku_key" ON "VarianteProducto"("sku");
CREATE UNIQUE INDEX "VarianteProducto_codigoBarras_key" ON "VarianteProducto"("codigoBarras");
CREATE INDEX "VarianteProducto_productoId_idx" ON "VarianteProducto"("productoId");
CREATE UNIQUE INDEX "VarianteAtributoValor_varianteId_atributoId_key" ON "VarianteAtributoValor"("varianteId", "atributoId");
CREATE INDEX "VarianteAtributoValor_atributoId_idx" ON "VarianteAtributoValor"("atributoId");

INSERT INTO "VarianteProducto" ("productoId", "sku", "codigoBarras", "nombre", "precioCompra", "precioVenta", "actualizado")
SELECT "id", "codigo", "codigoBarras", NULL, "precioCompra", "precioVenta", CURRENT_TIMESTAMP FROM "Producto";
