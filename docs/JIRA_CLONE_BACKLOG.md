# Jira Clone — Épicas, historias y control de calidad

## 1. Convenciones

| Elemento | Formato | Ejemplo |
|---|---|---|
| Épica | `JC-E##` | `JC-E03` |
| Historia | `JC-US-####` | `JC-US-0302` |
| Tarea técnica/QA | `JC-QA-####` | `JC-QA-0302` |
| Prioridad | `P0`, `P1`, `P2` | `P0` bloquea el MVP |

Una historia de API no está terminada hasta que sus pruebas de endpoint estén integradas y verdes. No se aceptan tareas de testing diferidas a otra release.

## 2. Épicas

| ID | Épica | Prioridad | Dependencias | Resultado |
|---|---|---:|---|---|
| JC-E00 | Base técnica y arquitectura | P0 | — | Aplicación reproducible y desplegable |
| JC-E01 | Identidad, sesiones y MFA | P0 | E00 | Acceso humano seguro |
| JC-E02 | Autorización, proyectos y aislamiento | P0 | E01 | Separación verificable por proyecto |
| JC-E03 | Incidencias y workflow | P0 | E02 | Flujo de trabajo humano completo |
| JC-E04 | Comentarios, búsqueda e historial | P0 | E03 | Colaboración y trazabilidad |
| JC-E05 | API pública para agentes | P0 | E02–E04 | API v1 segura y documentada |
| JC-E06 | Webhooks y adjuntos | P1 | E05 | Integraciones y archivos seguros |
| JC-E07 | Observabilidad y operación | P0 | E00, transversal | Servicio operable y recuperable |
| JC-E08 | Seguridad y hardening | P0 | transversal | Riesgos críticos mitigados |
| JC-E09 | Calidad, release y gobernanza | P0 | transversal | Evidencia de calidad y release controlada |

---

## JC-E00 — Base técnica y arquitectura

### JC-US-0001 — Bootstrap de aplicación independiente

**Objetivo:** crear el Jira Clone separado de ERPiso con Next.js, TypeScript, pnpm y estructura modular.

**Tareas:**

- Crear proyecto, módulos, configuración TypeScript estricta y variables de entorno documentadas.
- Definir separación `app → handlers/actions → services → repositories → Prisma`.
- Incorporar lint, typecheck, tests y build en CI.
- Añadir healthcheck de proceso sin información sensible.

**Aceptación:** instalación reproducible, `pnpm check` verde y ningún secreto versionado.

### JC-US-0002 — PostgreSQL, Prisma y migraciones

**Tareas:**

- Configurar PostgreSQL para desarrollo, CI, staging y producción.
- Crear migración inicial y seed del único `Organization` y administrador.
- Validar migraciones en una base vacía y en una base con la versión anterior.
- Documentar backup, restore y rollback compatible.

**QA:** pruebas de restricciones, relaciones, unicidad, rollback y seed idempotente.

### JC-US-0003 — Convenciones HTTP y OpenAPI

**Tareas:**

- Definir envelope de errores, request ID, fechas UTC, cursores y versionado `/api/v1`.
- Configurar validación de request/response y generación OpenAPI 3.1.
- Añadir prueba que falle si la implementación se desvía del contrato.

**Aceptación:** OpenAPI se genera determinísticamente y se valida en CI.

---

## JC-E01 — Identidad, sesiones y MFA

### JC-US-0101 — Login y sesiones revocables

**Tareas:** alta controlada, Argon2id, login, logout, cookies seguras, rotación y expiración de sesión.

**QA:** credenciales correctas/incorrectas, usuario inactivo, sesión expirada/revocada, fijación de sesión, cookie segura y rate limit.

### JC-US-0102 — Recuperación de contraseña

**Tareas:** tokens de un solo uso, expiración, invalidación de sesiones y respuesta anti-enumeración.

**QA:** token válido, vencido, usado, manipulado; mismo mensaje para correo existente/inexistente; revocación de sesiones.

### JC-US-0103 — MFA TOTP y recuperación

**Tareas:** enrolamiento, confirmación, desafío, códigos de recuperación y step-up para acciones sensibles.

**QA:** TOTP válido, fuera de ventana, reutilizado; recuperación de un solo uso; bypass de MFA imposible para administradores.

### JC-US-0104 — Administración de usuarios

**Tareas:** crear, desactivar, reactivar y asignar rol global.

**QA:** solo `ORG_ADMIN`, protección contra último administrador desactivado y auditoría sin secretos.

---

## JC-E02 — Autorización, proyectos y aislamiento

### JC-US-0201 — Motor de autorización centralizado

**Tareas:** roles globales y de proyecto, políticas reutilizables y denegación por defecto.

**QA:** matriz completa rol × operación, usuario inactivo, membresía revocada y pruebas contra IDOR/BOLA.

### JC-US-0202 — Crear y administrar proyectos

**Tareas:** claves únicas, nombre, descripción, estado, workflow base y borrado lógico.

**QA:** unicidad concurrente, claves inválidas, permisos, proyecto archivado y auditoría.

### JC-US-0203 — Membresías por proyecto

**Tareas:** agregar, cambiar rol y remover miembros.

**QA:** aislamiento entre proyectos, no escalamiento propio, último `PROJECT_ADMIN` protegido y revocación inmediata.

### JC-US-0204 — Repositorios con scoping obligatorio

**Tareas:** exigir contexto de autorización/proyecto en todas las consultas de entidades segregadas.

**QA:** suite automática que crea dos proyectos y demuestra que lecturas, escrituras, búsqueda y conteos no cruzan límites.

---

## JC-E03 — Incidencias y workflow

### JC-US-0301 — Crear incidencias

**Tareas:** clave secuencial por proyecto, tipos, título, Markdown, prioridad, reportero, responsable y padre.

**QA:** validaciones, permisos, secuencia concurrente, padre de otro proyecto rechazado, Markdown malicioso y auditoría.

### JC-US-0302 — Leer y listar incidencias

**Tareas:** detalle, listado por proyecto, paginación por cursor y orden estable.

**QA:** vacío, cursor válido/inválido, límite máximo, incidencia inexistente/no autorizada indistinguible y aislamiento.

### JC-US-0303 — Editar incidencias

**Tareas:** patch parcial, asignación, etiquetas y control optimista con `version`/`If-Match`.

**QA:** patch válido, campos desconocidos, permisos por rol, conflicto 409/412, no-op y auditoría del diff.

### JC-US-0304 — Transiciones de estado

**Tareas:** workflow fijo, reglas de transición y cancelación.

**QA:** cada transición válida, cada transición inválida, concurrencia, proyecto archivado y permisos.

### JC-US-0305 — Subtareas, épicas y enlaces

**Tareas:** relaciones padre/hijo y enlaces `blocks`, `relates_to`, `duplicates`.

**QA:** ciclos, autoenlace, enlace entre proyectos, eliminación lógica y autorización en ambos extremos.

---

## JC-E04 — Comentarios, búsqueda e historial

### JC-US-0401 — Comentarios

**Tareas:** crear, listar, editar propio según política y borrar lógicamente.

**QA:** sanitización, autoría, permisos, paginación, comentario de otro proyecto y auditoría.

### JC-US-0402 — Historial de cambios

**Tareas:** registrar cambios relevantes y mostrar timeline inmutable.

**QA:** orden, redacción de secretos, actor humano/agente, integridad y denegación entre proyectos.

### JC-US-0403 — Búsqueda y filtros

**Tareas:** texto, estado, tipo, prioridad, responsable y etiquetas; filtros permitidos explícitos.

**QA:** combinaciones, caracteres especiales, paginación, rendimiento base, rechazo de filtros desconocidos e aislamiento.

### JC-US-0404 — Tablero Kanban

**Tareas:** columnas del workflow, movimiento accesible y actualización optimista recuperable.

**QA:** estados vacío/error/carga, transición denegada, conflicto concurrente y E2E por rol.

---

## JC-E05 — API pública para agentes

### JC-US-0501 — Service accounts y API keys

**Tareas:** emitir, mostrar una vez, almacenar hash, scopes, grants por proyecto, expiración, rotación y revocación.

**QA:** formato y entropía, secreto nunca persistido/logueado, key inválida/expirada/revocada, scope insuficiente y rotación sin escalamiento.

### JC-US-0502 — `GET /api/v1/health`

**QA obligatorio:** 200 saludable, 503 dependencia crítica caída, respuesta sin secretos, rate limit y contrato OpenAPI.

### JC-US-0503 — `GET /api/v1/openapi.json`

**QA obligatorio:** JSON válido OpenAPI 3.1, respuesta reproducible, ejemplos válidos y todas las rutas implementadas presentes.

### JC-US-0504 — `GET /api/v1/projects`

**QA obligatorio:** autenticación, scope `projects:read`, solo proyectos concedidos, paginación, key revocada y contrato.

### JC-US-0505 — `GET /api/v1/projects/{projectKey}`

**QA obligatorio:** autorizado, clave inválida, inexistente/no autorizado, proyecto archivado, scope y contrato.

### JC-US-0506 — `GET /api/v1/projects/{projectKey}/issues`

**QA obligatorio:** scope `issues:read`, filtros, cursores, límites, orden estable, aislamiento y contrato.

### JC-US-0507 — `POST /api/v1/projects/{projectKey}/issues`

**QA obligatorio:** payload válido/inválido, scope `issues:write`, grant, sanitización, `Idempotency-Key` ausente/repetida/reutilizada con otro payload, concurrencia y contrato.

### JC-US-0508 — `GET /api/v1/issues/{issueKey}`

**QA obligatorio:** lectura autorizada, inexistente/no autorizada, key con otro proyecto, scope, issue archivada y contrato.

### JC-US-0509 — `PATCH /api/v1/issues/{issueKey}`

**QA obligatorio:** patch parcial, scope, grant, campo no editable, `If-Match` válido/obsoleto/ausente según política, XSS, auditoría y contrato.

### JC-US-0510 — `GET /api/v1/issues/{issueKey}/comments`

**QA obligatorio:** scope `comments:read`, paginación, orden, incidencia ajena, comentarios eliminados y contrato.

### JC-US-0511 — `POST /api/v1/issues/{issueKey}/comments`

**QA obligatorio:** scope `comments:write`, grant, contenido vacío/excesivo/malicioso, idempotencia, issue cerrada según política y contrato.

### JC-US-0512 — `POST /api/v1/issues/{issueKey}/transitions`

**QA obligatorio:** scope `issues:write`, transición válida/inválida, conflicto concurrente, idempotencia, proyecto archivado y contrato.

### JC-US-0513 — Rate limiting y protección de abuso

**Tareas:** límite por key e IP, headers informativos, 429 estable y allowlist opcional futura.

**QA:** ventana, recuperación, concurrencia, separación entre keys y no bypass por headers falsificados.

### JC-US-0514 — SDK y ejemplos para agentes

**Tareas:** ejemplos curl, TypeScript y Python generados/verificados contra OpenAPI.

**QA:** smoke test ejecuta cada ejemplo contra un entorno efímero.

---

## JC-E06 — Webhooks y adjuntos

### JC-US-0601 — Administración de webhooks

**Tareas:** alta, rotación de secreto, eventos y desactivación por proyecto.

**QA:** permisos, URL válida, prevención SSRF, secreto visible una vez y contrato.

### JC-US-0602 — Entregas firmadas y reintentos

**Tareas:** HMAC, delivery ID, timeout, backoff y dead-letter queue.

**QA:** firma verificable, replay detectable, códigos 2xx/4xx/5xx, timeout, orden no garantizado documentado e idempotencia.

### JC-US-0603 — Adjuntos privados

**Tareas:** URL firmada, límites, MIME real, antivirus, cuarentena y borrado lógico.

**QA:** archivo válido, extensión falsa, exceso de tamaño, malware simulado, URL expirada y acceso entre proyectos.

---

## JC-E07 — Observabilidad y operación

### JC-US-0701 — Logs, métricas y trazas

**Tareas:** request ID extremo a extremo, logs JSON, latencia/error/rate limit y trazas.

**QA:** secretos y tokens redactados, correlación verificable y alertas sintéticas probadas.

### JC-US-0702 — Backups y restauración

**Tareas:** backups cifrados, retención, restore automatizado y prueba periódica.

**QA:** restauración en entorno limpio, RPO/RTO medidos y evidencia archivada.

### JC-US-0703 — Despliegue y rollback

**Tareas:** staging, migraciones expand/contract, despliegue gradual y rollback.

**QA:** ensayo completo, compatibilidad entre versiones y healthchecks.

### JC-US-0704 — SLO y alertas

**Decisión inicial:** disponibilidad mensual 99,9 %, p95 de lecturas < 500 ms y errores 5xx < 1 %.

**QA:** paneles, alertas accionables y simulacro de incidente.

---

## JC-E08 — Seguridad y hardening

### JC-US-0801 — Threat model

**Tareas:** activos, fronteras de confianza y amenazas OWASP para UI/API/webhooks/archivos.

### JC-US-0802 — Suite de autorización adversarial

**Tareas:** IDOR/BOLA, escalamiento de rol, mass assignment, sesiones/keys revocadas y aislamiento de búsquedas.

### JC-US-0803 — Seguridad web

**Tareas:** CSP, CSRF, CORS cerrado, headers, sanitización Markdown y protección de uploads.

### JC-US-0804 — Dependencias y secretos

**Tareas:** escaneo SCA, secret scanning, SBOM y política de actualización.

### JC-US-0805 — Revisión previa al lanzamiento

**Aceptación:** cero vulnerabilidades críticas/altas abiertas; medias con responsable, fecha y aceptación explícita del riesgo.

---

## JC-E09 — Calidad, release y gobernanza

### JC-US-0901 — Pirámide y estrategia de pruebas

- Unitarias para reglas puras y políticas.
- Integración para servicios, Prisma y transacciones.
- Contrato para cada método/ruta OpenAPI.
- E2E para journeys humanos y de agentes.
- Seguridad y carga según riesgo.

### JC-US-0902 — Quality gates de pull request

**Obligatorios:** formato/lint, TypeScript, unitarias, integración afectada, contrato, build, migraciones, SCA, secret scanning y revisión humana.

### JC-US-0903 — Cobertura y mutation testing

**Umbrales iniciales:** 80 % líneas/branches globales; 90 % branches en auth/autorización/API keys/idempotencia; 100 % de endpoints con pruebas positivas, negativas, auth y contrato. La cobertura no reemplaza la revisión de casos.

### JC-US-0904 — Entorno efímero y datos de prueba

**Tareas:** PostgreSQL aislado por suite, factories para dos proyectos y limpieza determinista; prohibidos datos personales reales.

### JC-US-0905 — Release candidate y sign-off

**Tareas:** regression completa, carga, restore, threat review, OpenAPI diff y aprobación según gobernanza.

### JC-US-0906 — Flakiness y defectos

**Política:** una prueba flaky se registra como defecto, se pone en cuarentena por un máximo de 48 horas y tiene responsable; nunca se ignora indefinidamente.

## 3. Matriz mínima común para todos los endpoints

Cada endpoint debe probar, cuando aplique:

1. Camino exitoso y código HTTP exacto.
2. Request inválido, campos desconocidos y límites de tamaño.
3. Sin credencial, credencial inválida, vencida y revocada.
4. Scope insuficiente y rol insuficiente.
5. Acceso a recurso de otro proyecto.
6. Recurso inexistente sin filtrar su existencia.
7. Rate limit y formato de error estable.
8. Request ID y auditoría sin secretos.
9. Conformidad request/response con OpenAPI.
10. Idempotencia para comandos y concurrencia para recursos mutables.

## 4. Definition of Done

Una historia solo puede cerrarse si:

- Cumple aceptación y tiene demostración reproducible.
- Autoriza nuevamente en servidor y aplica aislamiento por proyecto.
- Incluye pruebas proporcionales al riesgo; si expone un endpoint, cumple la matriz común.
- Las pruebas fallan antes del cambio y pasan después, salvo funcionalidad completamente nueva justificada.
- Migraciones y rollback fueron revisados.
- No filtra secretos, tokens ni PII en logs/errores/auditoría.
- OpenAPI, documentación y ejemplos están actualizados.
- Todos los quality gates están verdes y existe revisión independiente.

## 5. Criterios de salida del MVP

- Todas las historias P0 terminadas y cero defectos críticos/altos abiertos.
- El 100 % de endpoints tiene pruebas de contrato, autorización positiva/negativa y aislamiento.
- Restore probado, métricas dentro del SLO y prueba de carga aprobada.
- API key revocada deja de funcionar inmediatamente.
- Dos proyectos usados en E2E no pueden cruzar datos por ninguna ruta.
- OpenAPI publicado coincide con el binario desplegado.
- Product Owner, Tech Lead y Security Owner aprueban el release candidate.

