ALTER TABLE "ReservaStock" ADD COLUMN "venceEn" DATETIME;
ALTER TABLE "ReservaStock" ADD COLUMN "liberadaEn" DATETIME;
ALTER TABLE "ReservaStock" ADD COLUMN "motivoLiberacion" TEXT;
CREATE INDEX "ReservaStock_estado_venceEn_idx" ON "ReservaStock"("estado", "venceEn");
