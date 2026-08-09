# Operación de producción

## Entorno y secretos

Producción usa `compose.production.yml`, volumen `erpiso_data` y `.env.production`; desarrollo usa `.env` y `dev.db`. Ningún `.env.production`, clave VAPID, contraseña ni respaldo se versiona. El servidor debe restringir ambos archivos al usuario de la aplicación.

Variables obligatorias: `DATABASE_URL=file:/data/erpiso.db`, credenciales iniciales sólo durante el seed, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`.

## Despliegue y migraciones

1. Crear un backup verificado: `pnpm db:backup /ruta/erpiso.db /ruta/backups`.
2. Construir una imagen versionada y ejecutar `pnpm db:deploy` contra el volumen antes de cambiar el contenedor.
3. Iniciar `docker compose -f compose.production.yml up -d --build`.
4. Verificar `/api/health`, login, una consulta de inventario y logs del contenedor.

No ejecutar `prisma migrate dev` en producción.

## Backups y restauración probada

Programar diariamente, fuera del contenedor, `pnpm db:backup /data/erpiso.db /backups`. Conservar 7 diarios, 4 semanales y 12 mensuales en almacenamiento externo cifrado. El comando usa la API online de SQLite y valida origen y copia con `PRAGMA quick_check`.

Ensayar mensualmente en un destino aislado:

`pnpm db:restore /backups/erpiso.db.FECHA.backup /restore-test/erpiso.db --confirm`

Ejecutar migraciones y `/api/health` contra la copia restaurada. Restaurar producción requiere detener escrituras, conservar la copia `before-restore`, ejecutar el mismo comando, migrar, iniciar y verificar conteos críticos.

## Rollback y monitoreo

Si falla una versión, detenerla, desplegar la imagen anterior y restaurar la base previa sólo cuando la migración no sea compatible. No revertir migraciones destructivamente sin backup probado. Monitorear healthcheck, reinicios, errores HTTP, espacio del volumen, edad/tamaño del último backup y expiración de TLS. Alertar si `/api/health` falla dos veces o no existe backup válido en 26 horas.
