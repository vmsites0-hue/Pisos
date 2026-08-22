ALTER TABLE "Inventario" ADD COLUMN "stockCuarentena" REAL NOT NULL DEFAULT 0;
CREATE TABLE "Devolucion" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "ventaId" INTEGER NOT NULL, "usuarioId" INTEGER NOT NULL, "aprobacionId" INTEGER, "motivo" TEXT NOT NULL, "evidenciaUrl" TEXT, "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Devolucion_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Devolucion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "DetalleDevolucion" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "devolucionId" INTEGER NOT NULL, "detalleVentaId" INTEGER NOT NULL, "inventarioId" INTEGER NOT NULL, "cantidad" REAL NOT NULL, "condicion" TEXT NOT NULL, "importe" REAL NOT NULL,
  CONSTRAINT "DetalleDevolucion_devolucionId_fkey" FOREIGN KEY ("devolucionId") REFERENCES "Devolucion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DetalleDevolucion_detalleVentaId_fkey" FOREIGN KEY ("detalleVentaId") REFERENCES "DetalleVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DetalleDevolucion_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Devolucion_ventaId_creadaEn_idx" ON "Devolucion"("ventaId", "creadaEn");
CREATE INDEX "DetalleDevolucion_detalleVentaId_idx" ON "DetalleDevolucion"("detalleVentaId");
INSERT OR IGNORE INTO "ParametroSistema" ("clave", "tipo", "valor", "valorPredeterminado", "descripcion", "validacion", "actualizadoEn") VALUES ('DEVOLUCION_CUARENTENA_HABILITADA', 'BOOLEAN', 'true', 'true', 'Permite enviar productos devueltos a cuarentena', '{}', CURRENT_TIMESTAMP);
