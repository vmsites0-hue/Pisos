CREATE TABLE "CierreCaja" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "periodoDesde" DATETIME NOT NULL,
  "periodoHasta" DATETIME NOT NULL,
  "responsableId" INTEGER NOT NULL,
  "importeEsperado" REAL NOT NULL,
  "importeDeclarado" REAL NOT NULL,
  "diferencia" REAL NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'CERRADO',
  "cerradoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reabiertoEn" DATETIME,
  "aprobacionReaperturaId" INTEGER,
  CONSTRAINT "CierreCaja_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CierreCaja_periodoDesde_periodoHasta_idx" ON "CierreCaja"("periodoDesde", "periodoHasta");
CREATE INDEX "CierreCaja_responsableId_cerradoEn_idx" ON "CierreCaja"("responsableId", "cerradoEn");
