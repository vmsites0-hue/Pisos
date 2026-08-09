ALTER TABLE "Entrega" ADD COLUMN "encargadoId" INTEGER REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Entrega" ADD COLUMN "choferId" INTEGER REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT OR IGNORE INTO "Permiso" ("codigo", "descripcion") VALUES ('delivery.assign', 'Asignar encargados y choferes');
INSERT OR IGNORE INTO "RolPermiso" ("rolId", "permisoId") SELECT "Rol"."id", "Permiso"."id" FROM "Rol", "Permiso" WHERE "Rol"."codigo" IN ('ADMINISTRADOR', 'LOGISTICA') AND "Permiso"."codigo" = 'delivery.assign';
