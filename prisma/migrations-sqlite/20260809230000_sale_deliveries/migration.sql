-- CreateTable
CREATE TABLE "Entrega" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "ventaId" INTEGER NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "clienteNombre" TEXT NOT NULL,
  "clienteTelefono" TEXT,
  "direccion" TEXT,
  "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadaEn" DATETIME NOT NULL,
  CONSTRAINT "Entrega_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Entrega_ventaId_key" ON "Entrega"("ventaId");
CREATE INDEX "Entrega_estado_creadaEn_idx" ON "Entrega"("estado", "creadaEn");
