ALTER TABLE "Inventario" ADD COLUMN "presentacionesCerradas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Inventario" ADD COLUMN "remanenteAbierto" REAL NOT NULL DEFAULT 0;

CREATE TABLE "EventoPresentacionInventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inventarioId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "remanenteAntes" REAL NOT NULL,
    "remanenteDespues" REAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventoPresentacionInventario_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventoPresentacionInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "EventoPresentacionInventario_inventarioId_creadoEn_idx" ON "EventoPresentacionInventario"("inventarioId", "creadoEn");
