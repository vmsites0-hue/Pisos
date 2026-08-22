-- AlterTable
ALTER TABLE "Venta" ADD COLUMN "excepcionComercialSnapshot" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "DetalleVenta" ADD COLUMN "precioOriginal" REAL;

INSERT OR IGNORE INTO "ParametroSistema" ("clave", "tipo", "valor", "valorPredeterminado", "descripcion", "validacion", "actualizadoEn") VALUES ('DESCUENTO_MANUAL_LIMITE_PORCENTAJE', 'NUMBER', '5', '5', 'Descuento manual máximo aplicable sin aprobación', '{"min":0,"max":100}', CURRENT_TIMESTAMP);
