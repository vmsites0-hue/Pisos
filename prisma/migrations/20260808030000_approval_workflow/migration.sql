CREATE TABLE "SolicitudAprobacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "valoresAntes" TEXT,
    "valoresPropuestos" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "solicitanteId" INTEGER NOT NULL,
    "aprobadorId" INTEGER,
    "solicitadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltoEn" DATETIME,
    "ejecutadoEn" DATETIME,
    CONSTRAINT "SolicitudAprobacion_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudAprobacion_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "PoliticaAprobacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "permitirAutoAprobacion" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX "SolicitudAprobacion_estado_solicitadoEn_idx" ON "SolicitudAprobacion"("estado", "solicitadoEn");
CREATE INDEX "SolicitudAprobacion_solicitanteId_idx" ON "SolicitudAprobacion"("solicitanteId");
INSERT INTO "PoliticaAprobacion" ("id", "permitirAutoAprobacion") VALUES (1, false);
