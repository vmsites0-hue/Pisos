# ERPiso — Contrato de trabajo Gitflow

## 1. Release activa

| Campo | Valor |
|---|---|
| Producto | ERPiso |
| Release | `mvp-1.0.0` |
| Alcance | Épicas E00 a E16 de `MVP_BACKLOG.md` |
| Rama estable | `main` |
| Rama de integración | `develop` |
| Estado inicial | Planificada |
| Facturación electrónica | Fuera de alcance |
| Multisucursal | Fuera de alcance; solo preparación interna mediante `branchId` |

## 2. Jerarquía de trabajo

```text
main
└── develop
    ├── epic/E00-base-tecnica
    │   ├── feature/E00-US-0001-estructura-modular
    │   ├── feature/E00-US-0002-entorno-reproducible
    │   └── feature/E00-US-0003-retirar-simulacion-fiscal
    ├── epic/E01-rbac-auditoria
    │   └── feature/E01-US-xxxx-descripcion
    └── epic/...

develop
└── release/mvp-1.0.0
    └── fix/mvp-1.0.0-descripcion
```

La release es el contenedor de alcance del backlog, pero su rama se crea cuando todas las épicas comprometidas están integradas en `develop`. Esto conserva Gitflow: la rama `release/*` se utiliza para estabilización, no para desarrollar funcionalidades nuevas.

## 3. Flujo obligatorio

### Inicio de una épica

1. Verificar que sus dependencias estén integradas en `develop`.
2. Actualizar `develop`.
3. Crear `epic/<codigo>-<slug>` desde `develop`.
4. No desarrollar directamente sobre la rama de épica.

### Inicio de una historia o tarea

1. Seleccionar una historia del backlog.
2. Confirmar su contrato de entrada y criterios de aceptación.
3. Crear `feature/<epica>-<historia>-<slug>` desde la rama de épica.
4. Implementar únicamente el alcance de esa historia.
5. Agregar o actualizar pruebas y documentación.
6. Verificar lint, tipos, pruebas y compilación aplicables.
7. Integrar la rama de tarea en su rama de épica mediante merge sin reescribir la historia.
8. Eliminar la rama de tarea después de verificar la integración.

### Cierre de una épica

1. Todas sus historias P0/P1 comprometidas están integradas.
2. Se ejecutan pruebas completas de la épica.
3. Se verifica su demostración funcional.
4. Se integra `epic/*` en `develop` mediante merge explícito.
5. Se elimina la rama de épica después de verificar `develop`.

### Preparación de release

1. Todas las épicas comprometidas están integradas y verdes en `develop`.
2. Se crea `release/mvp-1.0.0` desde `develop`.
3. En la release solo se aceptan correcciones, documentación, migraciones finales y preparación de despliegue.
4. Cada corrección utiliza `fix/mvp-1.0.0-<slug>` y vuelve a `release/mvp-1.0.0`.
5. No se agregan nuevas historias de producto durante estabilización.

### Publicación

1. La release supera los criterios de salida.
2. `release/mvp-1.0.0` se integra en `main`.
3. Se crea el tag anotado `v1.0.0`.
4. La release se reintegra en `develop` para conservar correcciones.
5. Se elimina la rama de release después de verificar ambos merges.

### Corrección urgente en producción

1. Crear `hotfix/<version>-<slug>` desde `main`.
2. Implementar y verificar la corrección.
3. Integrar en `main` y crear un tag de parche.
4. Reintegrar en `develop` y en cualquier release activa afectada.

## 4. Convención de ramas

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Épica | `epic/E##-descripcion` | `epic/E03-catalogo-parametrizable` |
| Historia/tarea | `feature/E##-US-####-descripcion` | `feature/E03-US-0306-conversion-cajas` |
| Release | `release/<nombre>` | `release/mvp-1.0.0` |
| Corrección de release | `fix/<release>-descripcion` | `fix/mvp-1.0.0-redondeo-cajas` |
| Hotfix | `hotfix/<version>-descripcion` | `hotfix/1.0.1-stock-negativo` |

No se crean ramas vacías por anticipado. Una rama representa trabajo iniciado y debe tener responsable, alcance y contrato de salida.

## 5. Contrato de entrada de una historia

Una historia puede comenzar cuando:

- Tiene identificador y pertenece a una épica.
- Su objetivo y criterios de aceptación están escritos.
- Sus dependencias están integradas o explícitamente disponibles.
- Las decisiones comerciales variables están representadas como parámetros.
- Se conoce qué datos, permisos y migraciones afecta.
- Se sabe cómo demostrarla y probarla.

Si una condición no se cumple, la historia permanece bloqueada y no se crea su rama.

## 6. Contrato de salida de una historia

Una historia está terminada cuando:

- Cumple todos sus criterios de aceptación.
- La lógica crítica se valida en el servidor.
- No contiene credenciales, datos sensibles ni simulaciones presentadas como funciones reales.
- Tiene pruebas proporcionales al riesgo.
- Lint, TypeScript y pruebas aplicables finalizan correctamente.
- Las migraciones son reproducibles y preservan datos cuando corresponda.
- La interfaz contempla carga, vacío, error y éxito.
- Respeta RBAC, auditoría y asignación automática del local principal cuando corresponda.
- La documentación afectada está actualizada.
- El diff fue revisado antes del merge.

## 7. Política de commits y merges

Formato recomendado:

```text
<tipo>(<alcance>): <descripción>
```

Tipos:

- `feat`: funcionalidad.
- `fix`: corrección.
- `refactor`: reorganización sin cambio funcional.
- `test`: pruebas.
- `docs`: documentación.
- `chore`: mantenimiento.
- `build`: compilación o dependencias.
- `ci`: integración continua.

Ejemplos:

```text
feat(inventory): add expiring stock reservations
fix(sales): prevent negative stock during concurrent checkout
docs(project): define MVP Gitflow contract
```

Reglas:

- Cada commit debe ser coherente y revisable.
- No se mezclan refactorizaciones ajenas con una historia funcional.
- No se utiliza `git reset --hard` ni force push sobre ramas compartidas.
- Los merges de tarea, épica y release deben conservar una frontera identificable.
- El historial publicado no se reescribe.

## 8. Criterios de integración

Antes de integrar una tarea o épica deben aprobarse:

1. Instalación reproducible con pnpm.
2. Lint.
3. Verificación de TypeScript.
4. Pruebas unitarias afectadas.
5. Pruebas de integración afectadas.
6. Compilación de producción cuando corresponda.
7. Revisión de migraciones.
8. Revisión de seguridad y permisos.
9. Demostración contra criterios de aceptación.

Una excepción debe quedar documentada; no se considera éxito silenciosamente.

## 9. Contrato de la release `mvp-1.0.0`

### Entrada

- Todas las historias P0 del backlog están integradas en `develop`.
- Las historias P1 incluidas en alcance están identificadas explícitamente.
- No existen migraciones pendientes de consolidación.
- Los flujos completos de la definición de terminado pueden demostrarse.

### Salida

- No existen defectos críticos ni altos abiertos.
- Las pruebas de conversión, stock, reservas, venta, crédito, logística y finanzas están verdes.
- La PWA puede instalarse y recibir notificaciones en plataformas compatibles.
- Se probó respaldo y restauración.
- Existe documentación de operación y despliegue.
- El comprobante se presenta como no fiscal.
- El tag `v1.0.0` apunta exactamente al commit publicado en `main`.

## 10. Orden inicial

El trabajo comienza con:

```text
epic/E00-base-tecnica
└── feature/E00-US-0001-estructura-modular
```

Al finalizar US-0001 se continúa con US-0002 y US-0003, cada una en su propia rama creada desde la versión actualizada de `epic/E00-base-tecnica`.
