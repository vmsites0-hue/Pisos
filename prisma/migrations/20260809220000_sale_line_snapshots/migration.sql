-- AlterTable
ALTER TABLE "DetalleVenta" ADD COLUMN "productoSnapshot" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "DetalleVenta" ADD COLUMN "impuesto" REAL NOT NULL DEFAULT 0;
ALTER TABLE "DetalleVenta" ADD COLUMN "moneda" TEXT NOT NULL DEFAULT 'PYG';
