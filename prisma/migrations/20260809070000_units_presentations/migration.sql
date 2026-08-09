CREATE TABLE "UnidadMedida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 2,
    "admiteDecimales" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "UnidadMedida_codigo_key" ON "UnidadMedida"("codigo");

INSERT INTO "UnidadMedida" ("codigo", "nombre", "simbolo", "precision", "admiteDecimales") VALUES
('UNIDAD', 'Unidad', 'un', 0, false),
('M2', 'Metro cuadrado', 'm²', 2, true),
('CAJA', 'Caja', 'cj', 0, false),
('PIEZA', 'Pieza', 'pz', 0, false),
('JUEGO', 'Juego', 'jgo', 0, false);

ALTER TABLE "VarianteProducto" ADD COLUMN "unidadBaseId" INTEGER REFERENCES "UnidadMedida"("id");
ALTER TABLE "VarianteProducto" ADD COLUMN "politicaVenta" TEXT NOT NULL DEFAULT 'UNIDADES_ENTERAS';
ALTER TABLE "VarianteProducto" ADD COLUMN "multiploVenta" REAL;

UPDATE "VarianteProducto" SET "unidadBaseId" = (
  SELECT "id" FROM "UnidadMedida" WHERE "codigo" = COALESCE((SELECT "unidadVenta" FROM "Producto" WHERE "Producto"."id" = "VarianteProducto"."productoId"), 'UNIDAD')
);
UPDATE "VarianteProducto" SET "politicaVenta" = CASE
  WHEN (SELECT "m2PorCaja" FROM "Producto" WHERE "Producto"."id" = "VarianteProducto"."productoId") IS NOT NULL
       AND (SELECT "permiteFraccion" FROM "Producto" WHERE "Producto"."id" = "VarianteProducto"."productoId") = false
    THEN 'SOLO_CAJAS_COMPLETAS'
  WHEN (SELECT "permiteFraccion" FROM "Producto" WHERE "Producto"."id" = "VarianteProducto"."productoId") = true
    THEN 'CAJAS_Y_FRACCION'
  ELSE 'UNIDADES_ENTERAS' END;

CREATE TABLE "PresentacionVariante" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "varianteId" INTEGER NOT NULL,
    "unidadId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "factorConversion" REAL NOT NULL,
    "piezas" INTEGER,
    "descripcion" TEXT,
    "predeterminada" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PresentacionVariante_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PresentacionVariante_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PresentacionVariante_varianteId_nombre_key" ON "PresentacionVariante"("varianteId", "nombre");
CREATE INDEX "PresentacionVariante_unidadId_idx" ON "PresentacionVariante"("unidadId");

INSERT INTO "PresentacionVariante" ("varianteId", "unidadId", "nombre", "factorConversion", "predeterminada")
SELECT v."id", u."id", u."nombre", 1, true FROM "VarianteProducto" v
JOIN "UnidadMedida" u ON u."id" = v."unidadBaseId";

INSERT INTO "PresentacionVariante" ("varianteId", "unidadId", "nombre", "factorConversion", "predeterminada", "descripcion")
SELECT v."id", u."id", 'Caja', p."m2PorCaja", false, 'Presentación migrada desde m² por caja'
FROM "VarianteProducto" v JOIN "Producto" p ON p."id" = v."productoId"
JOIN "UnidadMedida" u ON u."codigo" = 'CAJA'
WHERE p."m2PorCaja" IS NOT NULL AND p."m2PorCaja" > 0 AND p."unidadVenta" = 'M2';
