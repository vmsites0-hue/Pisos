-- AlterTable
ALTER TABLE "PresentacionVariante" ADD COLUMN "modoPrecio" TEXT NOT NULL DEFAULT 'DERIVADO';
ALTER TABLE "PresentacionVariante" ADD COLUMN "precioNeto" REAL;
ALTER TABLE "PresentacionVariante" ADD COLUMN "impuesto" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PresentacionVariante" ADD COLUMN "precioFinal" REAL;
ALTER TABLE "PresentacionVariante" ADD COLUMN "moneda" TEXT NOT NULL DEFAULT 'PYG';
