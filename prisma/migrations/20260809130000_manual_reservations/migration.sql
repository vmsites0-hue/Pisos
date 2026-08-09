CREATE TABLE "ReservaStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "presupuestoId" INTEGER NOT NULL,
    "creadaPorId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" DATETIME NOT NULL,
    CONSTRAINT "ReservaStock_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReservaStock_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ReservaStock_presupuestoId_estado_idx" ON "ReservaStock"("presupuestoId", "estado");

CREATE TABLE "LineaReservaStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservaId" INTEGER NOT NULL,
    "detallePresupuestoId" INTEGER NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT "LineaReservaStock_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "ReservaStock"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineaReservaStock_detallePresupuestoId_fkey" FOREIGN KEY ("detallePresupuestoId") REFERENCES "DetallePresupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LineaReservaStock_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "LineaReservaStock_detallePresupuestoId_estado_idx" ON "LineaReservaStock"("detallePresupuestoId", "estado");
CREATE INDEX "LineaReservaStock_inventarioId_estado_idx" ON "LineaReservaStock"("inventarioId", "estado");
