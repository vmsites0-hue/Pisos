ALTER TABLE "Entrega" ADD COLUMN "confirmadoPorId" INTEGER REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Entrega" ADD COLUMN "confirmadoEn" DATETIME;
ALTER TABLE "Entrega" ADD COLUMN "evidenciaUrl" TEXT;
INSERT OR IGNORE INTO "Permiso" ("codigo", "descripcion") VALUES ('delivery.confirm.any', 'Confirmar cualquier entrega');
INSERT OR IGNORE INTO "RolPermiso" ("rolId", "permisoId") SELECT "Rol"."id", "Permiso"."id" FROM "Rol", "Permiso" WHERE "Rol"."codigo" IN ('ADMINISTRADOR', 'LOGISTICA') AND "Permiso"."codigo" = 'delivery.confirm.any';
