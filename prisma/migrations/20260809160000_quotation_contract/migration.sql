ALTER TABLE "Presupuesto" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'ABIERTO';
ALTER TABLE "Presupuesto" ADD COLUMN "venceEn" DATETIME;
ALTER TABLE "Presupuesto" ADD COLUMN "actualizadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "Presupuesto_estado_venceEn_idx" ON "Presupuesto"("estado", "venceEn");

ALTER TABLE "DetallePresupuesto" ADD COLUMN "presentacionId" INTEGER REFERENCES "PresentacionVariante"("id");
ALTER TABLE "DetallePresupuesto" ADD COLUMN "descuento" REAL NOT NULL DEFAULT 0;
UPDATE "DetallePresupuesto" SET "presentacionId" = (
  SELECT "id" FROM "PresentacionVariante" WHERE "PresentacionVariante"."varianteId" = "DetallePresupuesto"."varianteId" ORDER BY "predeterminada" DESC, "id" LIMIT 1
);
