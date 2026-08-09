ALTER TABLE "Inventario" ADD COLUMN "varianteId" INTEGER REFERENCES "VarianteProducto"("id");
ALTER TABLE "Inventario" ADD COLUMN "lote" TEXT;
ALTER TABLE "Inventario" ADD COLUMN "tono" TEXT;
ALTER TABLE "Inventario" ADD COLUMN "calibre" TEXT;
UPDATE "Inventario" SET "varianteId" = (SELECT "id" FROM "VarianteProducto" WHERE "VarianteProducto"."productoId" = "Inventario"."productoId" ORDER BY "id" LIMIT 1);
UPDATE "Inventario" SET "lote" = "loteTono" WHERE "loteTono" IS NOT NULL;
CREATE INDEX "Inventario_varianteId_sucursalId_lote_tono_calibre_idx" ON "Inventario"("varianteId", "sucursalId", "lote", "tono", "calibre");

ALTER TABLE "DetalleVenta" ADD COLUMN "varianteId" INTEGER REFERENCES "VarianteProducto"("id");
UPDATE "DetalleVenta" SET "varianteId" = (SELECT "id" FROM "VarianteProducto" WHERE "VarianteProducto"."productoId" = "DetalleVenta"."productoId" ORDER BY "id" LIMIT 1);
ALTER TABLE "DetallePresupuesto" ADD COLUMN "varianteId" INTEGER REFERENCES "VarianteProducto"("id");
UPDATE "DetallePresupuesto" SET "varianteId" = (SELECT "id" FROM "VarianteProducto" WHERE "VarianteProducto"."productoId" = "DetallePresupuesto"."productoId" ORDER BY "id" LIMIT 1);
