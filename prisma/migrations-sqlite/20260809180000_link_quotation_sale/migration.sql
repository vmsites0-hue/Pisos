-- AlterTable
ALTER TABLE "Venta" ADD COLUMN "presupuestoId" INTEGER REFERENCES "Presupuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Venta_presupuestoId_key" ON "Venta"("presupuestoId");
