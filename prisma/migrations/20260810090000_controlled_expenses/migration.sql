ALTER TABLE "Gasto" ADD COLUMN "metodoPago" TEXT NOT NULL DEFAULT 'EFECTIVO';
ALTER TABLE "Gasto" ADD COLUMN "comprobanteUrl" TEXT;
ALTER TABLE "Gasto" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'CONFIRMADO';
ALTER TABLE "Gasto" ADD COLUMN "usuarioId" INTEGER;
ALTER TABLE "Gasto" ADD COLUMN "anuladoEn" DATETIME;
ALTER TABLE "Gasto" ADD COLUMN "motivoAnulacion" TEXT;
CREATE INDEX "Gasto_usuarioId_fecha_idx" ON "Gasto"("usuarioId", "fecha");
