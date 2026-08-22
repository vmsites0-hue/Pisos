-- CreateTable
CREATE TABLE "Rol" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "Permiso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL
);

CREATE TABLE "UsuarioRol" (
    "usuarioId" INTEGER NOT NULL,
    "rolId" INTEGER NOT NULL,
    PRIMARY KEY ("usuarioId", "rolId"),
    CONSTRAINT "UsuarioRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RolPermiso" (
    "rolId" INTEGER NOT NULL,
    "permisoId" INTEGER NOT NULL,
    PRIMARY KEY ("rolId", "permisoId"),
    CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Rol_codigo_key" ON "Rol"("codigo");
CREATE UNIQUE INDEX "Permiso_codigo_key" ON "Permiso"("codigo");

-- Preserve the legacy role of existing users. Permissions are assigned by the seed.
INSERT INTO "Rol" ("codigo", "nombre")
SELECT DISTINCT "rol", CASE "rol"
  WHEN 'ADMINISTRADOR' THEN 'Administrador'
  WHEN 'VENDEDOR' THEN 'Vendedor'
  ELSE "rol"
END
FROM "Usuario";

INSERT INTO "UsuarioRol" ("usuarioId", "rolId")
SELECT u."id", r."id"
FROM "Usuario" u
JOIN "Rol" r ON r."codigo" = u."rol";
