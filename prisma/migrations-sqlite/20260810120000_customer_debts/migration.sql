CREATE TABLE "DeudaCliente" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "clienteId" INTEGER NOT NULL,
  "concepto" TEXT NOT NULL,
  "montoOriginal" REAL NOT NULL,
  "saldo" REAL NOT NULL,
  "fechaDeuda" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaVencimiento" DATETIME,
  "notas" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "usuarioId" INTEGER NOT NULL,
  "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeudaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "DeudaCliente_clienteId_estado_idx" ON "DeudaCliente"("clienteId", "estado");
