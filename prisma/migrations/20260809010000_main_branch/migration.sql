ALTER TABLE "Sucursal" ADD COLUMN "esPrincipal" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Sucursal"
SET "esPrincipal" = true
WHERE "id" = (
  SELECT "id" FROM "Sucursal" WHERE "activa" = true ORDER BY "id" ASC LIMIT 1
);

-- Backfill branch ownership for every existing operational record. SQLite
-- cannot add a non-null foreign key without rebuilding populated tables, so
-- the application schema enforces required values for all new writes.
ALTER TABLE "Cliente" ADD COLUMN "sucursalId" INTEGER REFERENCES "Sucursal"("id");
ALTER TABLE "Presupuesto" ADD COLUMN "sucursalId" INTEGER REFERENCES "Sucursal"("id");
ALTER TABLE "Gasto" ADD COLUMN "sucursalId" INTEGER REFERENCES "Sucursal"("id");
ALTER TABLE "ReglaDescuento" ADD COLUMN "sucursalId" INTEGER REFERENCES "Sucursal"("id");

UPDATE "Usuario" SET "sucursalId" = (SELECT "id" FROM "Sucursal" WHERE "esPrincipal" = true LIMIT 1) WHERE "sucursalId" IS NULL;
UPDATE "Cliente" SET "sucursalId" = (SELECT "id" FROM "Sucursal" WHERE "esPrincipal" = true LIMIT 1);
UPDATE "Presupuesto" SET "sucursalId" = (SELECT "id" FROM "Sucursal" WHERE "esPrincipal" = true LIMIT 1);
UPDATE "Gasto" SET "sucursalId" = (SELECT "id" FROM "Sucursal" WHERE "esPrincipal" = true LIMIT 1);
UPDATE "ReglaDescuento" SET "sucursalId" = (SELECT "id" FROM "Sucursal" WHERE "esPrincipal" = true LIMIT 1);

CREATE INDEX "Cliente_sucursalId_idx" ON "Cliente"("sucursalId");
CREATE INDEX "Presupuesto_sucursalId_idx" ON "Presupuesto"("sucursalId");
CREATE INDEX "Gasto_sucursalId_idx" ON "Gasto"("sucursalId");
CREATE INDEX "ReglaDescuento_sucursalId_idx" ON "ReglaDescuento"("sucursalId");
