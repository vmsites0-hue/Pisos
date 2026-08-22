CREATE TABLE "ParametroSistema" (
    "clave" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "valorPredeterminado" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "validacion" TEXT NOT NULL,
    "actualizadoEn" DATETIME NOT NULL
);

ALTER TABLE "Venta" ADD COLUMN "configuracionSnapshot" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Presupuesto" ADD COLUMN "configuracionSnapshot" TEXT NOT NULL DEFAULT '{}';
