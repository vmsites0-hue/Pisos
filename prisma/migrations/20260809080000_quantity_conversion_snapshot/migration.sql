ALTER TABLE "DetalleVenta" ADD COLUMN "cantidadSolicitada" REAL;
ALTER TABLE "DetalleVenta" ADD COLUMN "cantidadPresentacion" REAL;
ALTER TABLE "DetalleVenta" ADD COLUMN "conversionSnapshot" TEXT NOT NULL DEFAULT '{}';
UPDATE "DetalleVenta" SET "cantidadSolicitada" = "cantidad", "cantidadPresentacion" = "cantidad";

ALTER TABLE "DetallePresupuesto" ADD COLUMN "cantidadSolicitada" REAL;
ALTER TABLE "DetallePresupuesto" ADD COLUMN "cantidadPresentacion" REAL;
ALTER TABLE "DetallePresupuesto" ADD COLUMN "conversionSnapshot" TEXT NOT NULL DEFAULT '{}';
UPDATE "DetallePresupuesto" SET "cantidadSolicitada" = "cantidad", "cantidadPresentacion" = "cantidad";
