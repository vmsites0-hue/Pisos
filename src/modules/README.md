# Módulos de negocio

La aplicación se organiza por capacidad de negocio. Las rutas de `src/app` son adaptadores de presentación: obtienen datos mediante repositorios de módulo y renderizan componentes, sin consultar Prisma directamente.

## Capas permitidas

```text
app/page
  -> repositories (lectura)
  -> components
       -> actions (comandos desde el cliente)
            -> services (reglas y transacciones)
                 -> Prisma
```

Cada módulo puede contener:

- `components`: interfaz propia del módulo.
- `actions`: adaptadores `use server`; no contienen reglas comerciales.
- `services`: casos de uso, validaciones operativas y transacciones.
- `repositories`: consultas de lectura y persistencia reutilizable.
- `schemas`: validación de contratos de entrada.
- `types.ts`: tipos públicos del módulo.

## Reglas de dependencia

1. Los componentes no importan Prisma.
2. Las páginas no importan Prisma.
3. Los componentes llaman acciones; no llaman servicios ni repositorios directamente.
4. Las acciones delegan en servicios.
5. Los servicios pueden utilizar Prisma y repositorios, pero no componentes.
6. Los repositorios no importan React, Next.js ni componentes.
7. `src/components` queda reservado para UI y layout compartidos.
8. Un módulo no debe importar archivos internos de otro módulo salvo su contrato público o una acción diseñada para ese uso.

## Módulos actuales

- `branches`: compatibilidad temporal del local principal.
- `customers`: clientes.
- `dashboard`: consultas del tablero.
- `discounts`: reglas de descuento.
- `finance`: cobros, gastos y consultas financieras.
- `inventory`: catálogo actual e inventario.
- `logistics`: entregas y estados logísticos.
- `quotations`: presupuestos.
- `sales`: punto de venta.
- `settings`: consultas y pantalla de configuración.

## Módulos previstos por el backlog

Se incorporarán en sus historias correspondientes:

- `auth`: autenticación y sesiones.
- `authorization`: RBAC y aprobaciones.
- `audit`: registro de actividad.
- `catalog`: familias, atributos, variantes y presentaciones; absorberá la parte de catálogo que hoy vive en `inventory`.
- `credits`: productos de crédito, cronogramas y cuotas.
- `notifications`: bandeja y Web Push.
- `returns`: cancelaciones, devoluciones y pérdidas.
- `users`: empleados y asignaciones.

No se crean carpetas vacías antes de comenzar una historia. Cada módulo nuevo nace dentro de su rama de tarea y con un contrato ejecutable.
