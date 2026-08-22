ALTER TABLE "Cliente" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'PERSONA';
ALTER TABLE "Cliente" ADD COLUMN "razonSocial" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "Cliente_activo_nombre_apellido_idx" ON "Cliente"("activo", "nombre", "apellido");
