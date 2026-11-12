-- CreateTable
CREATE TABLE "DeudaCliente" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "montoOriginal" DOUBLE PRECISION NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "fechaDeuda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "usuarioId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeudaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeudaCliente_clienteId_estado_idx" ON "DeudaCliente"("clienteId", "estado");

-- AddForeignKey
ALTER TABLE "DeudaCliente" ADD CONSTRAINT "DeudaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
