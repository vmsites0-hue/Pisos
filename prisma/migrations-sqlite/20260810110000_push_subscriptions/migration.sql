CREATE TABLE "SuscripcionPush" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "usuarioId" INTEGER NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "dispositivo" TEXT,
  "activa" BOOLEAN NOT NULL DEFAULT true,
  "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadaEn" DATETIME NOT NULL,
  CONSTRAINT "SuscripcionPush_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SuscripcionPush_endpoint_key" ON "SuscripcionPush"("endpoint");
CREATE INDEX "SuscripcionPush_usuarioId_activa_idx" ON "SuscripcionPush"("usuarioId", "activa");
