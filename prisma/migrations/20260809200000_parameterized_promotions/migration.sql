-- AlterTable
ALTER TABLE "ReglaDescuento" ADD COLUMN "familiaId" INTEGER;
ALTER TABLE "ReglaDescuento" ADD COLUMN "marcaId" INTEGER;
ALTER TABLE "ReglaDescuento" ADD COLUMN "productoId" INTEGER;
ALTER TABLE "ReglaDescuento" ADD COLUMN "varianteId" INTEGER;
ALTER TABLE "ReglaDescuento" ADD COLUMN "clienteId" INTEGER;
ALTER TABLE "ReglaDescuento" ADD COLUMN "vigenteDesde" DATETIME;
ALTER TABLE "ReglaDescuento" ADD COLUMN "vigenteHasta" DATETIME;

ALTER TABLE "Venta" ADD COLUMN "reglaDescuentoId" INTEGER REFERENCES "ReglaDescuento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Venta" ADD COLUMN "descuentoAutomatico" REAL NOT NULL DEFAULT 0;
