-- AlterTable
ALTER TABLE "DetalleVenta" ADD COLUMN "inventarioId" INTEGER REFERENCES "Inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CancelacionVenta" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "ventaId" INTEGER NOT NULL,
  "motivo" TEXT NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "aprobacionId" INTEGER,
  "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CancelacionVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CancelacionVenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CancelacionVenta_ventaId_key" ON "CancelacionVenta"("ventaId");
