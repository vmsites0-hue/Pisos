CREATE TABLE "Familia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "Marca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX "Familia_nombre_key" ON "Familia"("nombre");
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

ALTER TABLE "Categoria" ADD COLUMN "activa" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Categoria" ADD COLUMN "familiaId" INTEGER REFERENCES "Familia"("id");
ALTER TABLE "Producto" ADD COLUMN "familiaId" INTEGER REFERENCES "Familia"("id");
ALTER TABLE "Producto" ADD COLUMN "marcaId" INTEGER REFERENCES "Marca"("id");

INSERT INTO "Familia" ("nombre") VALUES ('Pisos'), ('Baño'), ('Complementos'), ('Otros');
UPDATE "Categoria" SET "familiaId" = (SELECT "id" FROM "Familia" WHERE "nombre" = CASE
  WHEN "Categoria"."nombre" = 'Pisos' THEN 'Pisos'
  WHEN "Categoria"."nombre" IN ('Juegos de baño', 'Griferías') THEN 'Baño'
  WHEN "Categoria"."nombre" = 'Adhesivos' THEN 'Complementos'
  ELSE 'Otros' END);

INSERT INTO "Marca" ("nombre") SELECT DISTINCT "marca" FROM "Producto" WHERE "marca" IS NOT NULL AND TRIM("marca") <> '';
UPDATE "Producto" SET "marcaId" = (SELECT "id" FROM "Marca" WHERE "Marca"."nombre" = "Producto"."marca");
UPDATE "Producto" SET "familiaId" = (SELECT "familiaId" FROM "Categoria" WHERE "Categoria"."id" = "Producto"."categoriaId");
