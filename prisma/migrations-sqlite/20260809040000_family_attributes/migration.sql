CREATE TABLE "AtributoFamilia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "familiaId" INTEGER NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "filtrable" BOOLEAN NOT NULL DEFAULT false,
    "identidad" BOOLEAN NOT NULL DEFAULT false,
    "opciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AtributoFamilia_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AtributoFamilia_familiaId_clave_key" ON "AtributoFamilia"("familiaId", "clave");
