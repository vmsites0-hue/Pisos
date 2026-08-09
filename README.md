# ERPiso

ERPiso es un sistema de gestión para una empresa que vende pisos y productos relacionados. El MVP cubre catálogo, inventario, clientes, presupuestos, ventas, logística y finanzas básicas.

La versión actual utiliza Next.js, React, TypeScript, Prisma y SQLite. La facturación electrónica no forma parte del MVP; los comprobantes generados por la aplicación son documentos internos no fiscales.

## Requisitos

- Node.js compatible con Next.js 16.
- pnpm 11.8.0 o compatible.
- Git.

El proyecto utiliza exclusivamente pnpm. No se deben generar ni versionar archivos `package-lock.json` o `yarn.lock`.

## Instalación

```bash
git clone <url-del-repositorio>
cd Pisos
pnpm install --frozen-lockfile
```

Copiar el archivo de configuración:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Antes de ejecutar el seed, cambiar `SEED_ADMIN_PASSWORD` en `.env`.

## Base de datos nueva

Crear el esquema mediante las migraciones versionadas:

```bash
pnpm db:deploy
pnpm db:generate
pnpm db:seed
```

El seed es idempotente y crea, si no existen:

- Local principal.
- Categorías comerciales iniciales.
- Usuario administrador indicado en las variables `SEED_ADMIN_*`.

La contraseña se almacena mediante scrypt. Después del seed, se inicia sesión en
`/login` con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`. Las sesiones duran 12
horas, pueden revocarse en la base y dejan de ser válidas si el usuario se desactiva.

En `/configuracion` el administrador puede crear empleados, asignarles varios
roles, cambiar el nombre visible de los roles y configurar sus permisos. Los
códigos internos de permisos son estables y todas las mutaciones se autorizan
de nuevo en el servidor.

La bandeja `/aprobaciones` gestiona autorizaciones para descuentos fuera de
límite, cambios manuales de precio, ajustes negativos, cancelaciones,
devoluciones y eliminación de gastos. Por defecto nadie puede aprobar su propia
solicitud y cada aprobación puede consumirse una sola vez.

`/auditoria` ofrece un registro de solo lectura para accesos y operaciones
sensibles. Contraseñas, tokens, cookies y secretos se redactan antes de guardar
los valores anteriores o posteriores.

## Base local histórica

El repositorio original contenía `dev.db` sin historial de migraciones. No se debe ejecutar la migración inicial sobre esa base como si estuviera vacía.

Para conservar información existente:

1. Realizar una copia de seguridad de `dev.db`.
2. Verificar que su estructura coincide con `prisma/schema.prisma`.
3. Marcar la migración inicial como aplicada:

```bash
pnpm exec prisma migrate resolve --applied 20260808000000_initial
```

Este procedimiento solo establece la línea base; no modifica tablas ni corrige diferencias existentes.

## Desarrollo

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Verificaciones

```bash
pnpm typecheck
pnpm lint
pnpm build
```

O ejecutar la verificación completa:

```bash
pnpm check
```

## Scripts disponibles

| Comando | Uso |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilación de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | Revisión ESLint |
| `pnpm typecheck` | Verificación TypeScript |
| `pnpm check` | Tipos, lint y build |
| `pnpm db:generate` | Generar Prisma Client |
| `pnpm db:migrate` | Crear/aplicar migraciones en desarrollo |
| `pnpm db:deploy` | Aplicar migraciones versionadas |
| `pnpm db:seed` | Crear datos mínimos iniciales |
| `pnpm db:studio` | Abrir Prisma Studio |
| `pnpm test` | Ejecutar pruebas unitarias una vez |
| `pnpm test:watch` | Ejecutar pruebas unitarias en modo interactivo |
| `pnpm check` | TypeScript, lint, tests unitarios y build de producción |

## Arquitectura

Las rutas se encuentran en `src/app` y la lógica se organiza por negocio en `src/modules`.

```text
src/
├── app/                 # Rutas y composición
├── components/          # UI y layout compartidos
├── lib/                 # Infraestructura común
└── modules/
    └── <modulo>/
        ├── actions/     # Adaptadores use server
        ├── components/  # Interfaz del módulo
        ├── repositories/# Consultas y persistencia
        └── services/    # Casos de uso y reglas
```

Consultar [src/modules/README.md](src/modules/README.md) para las reglas de dependencia.

## Flujo de trabajo

- [Backlog del MVP](docs/MVP_BACKLOG.md)
- [Contrato Gitflow](docs/GITFLOW_CONTRACT.md)

El desarrollo se realiza mediante:

```text
main → develop → epic/* → feature/*
```

Las ramas `release/*` se crean desde `develop` durante la estabilización.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---:|---|
| `DATABASE_URL` | Sí | URL SQLite usada por Prisma |
| `SEED_ADMIN_EMAIL` | Para seed | Correo del administrador inicial |
| `SEED_ADMIN_PASSWORD` | Para seed | Contraseña inicial; debe cambiarse |
| `SEED_ADMIN_NAME` | Para seed | Nombre del administrador inicial |

No se deben confirmar archivos `.env`, bases con información real, certificados ni credenciales.
