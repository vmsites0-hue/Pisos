# Planning: clon seguro de Jira single-tenant

Documentos ejecutables relacionados:

- [Épicas, historias y control de calidad](JIRA_CLONE_BACKLOG.md)
- [Gobernanza del proyecto](JIRA_CLONE_GOVERNANCE.md)

## 1. Decisiones de producto

### Preguntas resueltas

**¿Es multiempresa?**  
No. La primera versión será single-tenant: una instalación pertenece a una sola organización. Esto reduce complejidad y superficie de ataque. La separación interna se hará por proyectos.

**¿Cómo se separan los proyectos?**  
Cada incidencia pertenece exactamente a un proyecto. Los miembros y permisos se asignan por proyecto, además de existir roles globales de la organización. Toda consulta y mutación debe recibir o derivar un `projectId` y volver a autorizarlo en el servidor.

**¿Qué jerarquía de trabajo tendrá?**  
Proyecto → épica → incidencia. Una incidencia puede ser de tipo tarea, historia, bug o subtarea. Las subtareas pertenecen a una incidencia padre. No se implementarán jerarquías configurables en el MVP.

**¿Qué flujo tendrá una incidencia?**  
Un flujo fijo por proyecto: `BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE`, con `CANCELED` como salida adicional. Los administradores de proyecto podrán ocultar estados, pero no crear workflows arbitrarios en el MVP.

**¿Quién puede crear proyectos?**  
Solo un administrador de la organización. El creador se convierte en administrador del proyecto.

**¿Cómo se autentican las personas?**  
Correo y contraseña, sesiones revocables en cookies `HttpOnly`, `Secure` y `SameSite=Lax`. Las contraseñas se almacenan con Argon2id. Se exigirá MFA TOTP a administradores y será opcional para miembros en el MVP.

**¿Cómo se autentican los agentes?**  
Con API keys personales o de servicio. Solo se muestra el secreto una vez y en la base se guarda un hash. Cada key tiene scopes, proyectos permitidos, fecha de expiración, último uso y revocación inmediata.

**¿El endpoint público será anónimo?**  
No. “Público” significará accesible por HTTPS desde fuera de la red, con contrato documentado. Solo `/api/v1/health` y la especificación OpenAPI podrán ser anónimos. Los datos de proyectos siempre requieren autenticación.

**¿Qué podrá hacer un agente?**  
Listar proyectos autorizados, buscar incidencias, leer una incidencia y sus comentarios, crear incidencias, comentar y cambiar campos o estado si su key tiene el scope correspondiente. No podrá administrar usuarios, permisos ni emitir otras keys.

**¿Habrá webhooks?**  
Sí, después del núcleo del API. Serán firmados con HMAC, tendrán reintentos y un identificador de entrega idempotente.

**¿Qué queda fuera del MVP?**  
Sprints, roadmaps, automatizaciones visuales, marketplace, campos personalizados arbitrarios, SSO/SAML, apps móviles, facturación y multi-tenancy empresarial.

## 2. Stack decidido

- Frontend y backend web: Next.js 16, React 19 y TypeScript.
- API: Route Handlers versionados bajo `/api/v1`.
- Persistencia de producción: PostgreSQL con Prisma.
- Validación de entrada y generación de OpenAPI: Zod más un adaptador OpenAPI.
- Autenticación humana: implementación propia por sesiones o una librería compatible con sesiones persistidas; no JWT de larga duración en el navegador.
- Autenticación de agentes: API keys opacas con prefijo identificable y secreto aleatorio de al menos 256 bits.
- Cola para webhooks y trabajos: Redis/BullMQ en la fase que incorpore integraciones.
- Archivos adjuntos: almacenamiento S3 compatible mediante URLs firmadas, con antivirus antes de publicación.
- Observabilidad: logs JSON con request ID, métricas, trazas y alertas de errores.

El Jira clone debe vivir como una aplicación o repositorio independiente de ERPiso. Se puede reutilizar el estilo arquitectónico por módulos, pero no compartir su esquema de base de datos ni su dominio.

## 3. Modelo de permisos

### Roles globales

- `ORG_ADMIN`: usuarios, configuración, auditoría y todos los proyectos.
- `ORG_MEMBER`: sin acceso implícito a proyectos.

### Roles de proyecto

- `PROJECT_ADMIN`: configuración del proyecto y miembros.
- `MAINTAINER`: crea, edita, asigna y mueve incidencias.
- `CONTRIBUTOR`: crea, comenta y edita incidencias permitidas.
- `VIEWER`: solo lectura.

### Scopes de API keys

- `projects:read`
- `issues:read`
- `issues:write`
- `comments:read`
- `comments:write`
- `webhooks:manage`

La autorización efectiva es la intersección de: usuario o service account activo, scopes de la key, proyectos permitidos y rol dentro del proyecto. Nunca se confiará en un `projectId` enviado por el cliente sin comprobar membresía.

## 4. Modelo de datos inicial

- `Organization`: la única organización de la instalación.
- `User`, `Credential`, `Session`, `MfaMethod`, `RecoveryCode`.
- `Project`, `ProjectMember`, `ProjectRole`.
- `Issue`, `IssueType`, `IssueStatus`, `IssueLink`.
- `Comment`, `Attachment`, `Label`, `IssueLabel`.
- `ApiKey`, `ServiceAccount`, `ApiKeyProjectGrant`.
- `Webhook`, `WebhookDelivery`.
- `AuditEvent` inmutable.

Campos esenciales de `Issue`: identificador interno UUID, clave humana como `APP-123`, proyecto, tipo, título, descripción Markdown, estado, prioridad, reportero, responsable opcional, padre opcional, fechas, versión de concurrencia y borrado lógico.

## 5. Contrato público para agentes

Base: `/api/v1`.

Endpoints MVP:

- `GET /projects`
- `GET /projects/{projectKey}`
- `GET /projects/{projectKey}/issues`
- `POST /projects/{projectKey}/issues`
- `GET /issues/{issueKey}`
- `PATCH /issues/{issueKey}`
- `GET /issues/{issueKey}/comments`
- `POST /issues/{issueKey}/comments`
- `POST /issues/{issueKey}/transitions`
- `GET /openapi.json`
- `GET /health`

Normas del contrato:

- `Authorization: Bearer <api-key>`.
- JSON estricto, fechas ISO 8601 UTC y UUID para IDs internos.
- Paginación por cursor, máximo 100 elementos.
- Filtros permitidos explícitamente; no se aceptará SQL ni un lenguaje de consultas libre en el MVP.
- `Idempotency-Key` obligatorio para creaciones hechas por agentes.
- Control optimista mediante `version` o `If-Match` para evitar sobrescrituras.
- Errores con formato estable: `code`, `message`, `details`, `requestId`.
- Límites iniciales: 60 solicitudes/minuto por key y límites adicionales por IP.
- OpenAPI 3.1 como contrato canónico, con ejemplos pensados para herramientas de agentes.

Ejemplo de creación:

```http
POST /api/v1/projects/APP/issues
Authorization: Bearer jat_live_...
Idempotency-Key: 2d6dfaf8-6f81-4c79-b459-308442f21e9a
Content-Type: application/json

{
  "type": "BUG",
  "title": "El login rechaza códigos TOTP válidos",
  "description": "Pasos de reproducción...",
  "priority": "HIGH"
}
```

## 6. Arquitectura interna

Se mantendrá una arquitectura modular:

```text
src/app             rutas web y Route Handlers
src/modules/auth    login, MFA, sesiones y API keys
src/modules/projects
src/modules/issues
src/modules/comments
src/modules/webhooks
src/modules/audit
src/lib             infraestructura compartida
```

Cada entrada, tanto UI como API, llama a los mismos servicios de aplicación. Los Route Handlers validan, autentican y traducen HTTP; las reglas y transacciones viven en servicios. Esto evita que el API para agentes pueda saltarse reglas que sí aplica la interfaz.

## 7. Plan de ejecución

### Fase 0 — Especificación y base técnica

- Crear la aplicación independiente, CI y entornos local/staging/producción.
- Configurar PostgreSQL, Prisma, migraciones y datos de desarrollo.
- Definir OpenAPI inicial y decisiones de arquitectura.
- Incorporar gestión de secretos, headers seguros y logging estructurado.

**Salida:** aplicación desplegable, esquema base y pipeline que ejecuta tipos, lint, tests y build.

### Fase 1 — Identidad y seguridad

- Alta inicial controlada del `ORG_ADMIN`; no habrá registro público.
- Login, logout, recuperación de contraseña y sesiones revocables.
- MFA TOTP, códigos de recuperación y step-up auth para acciones sensibles.
- RBAC global, auditoría de accesos y protección CSRF.
- Rate limiting, bloqueo progresivo y rotación de sesión.

**Salida:** usuarios administrables y pruebas de aislamiento/autorización.

### Fase 2 — Proyectos e incidencias

- CRUD de proyectos, claves únicas y membresías.
- Backlog, tablero Kanban y detalle de incidencia.
- Comentarios, etiquetas, asignación, prioridad y transiciones.
- Historial de cambios y búsqueda básica por texto/filtros.

**Salida:** flujo humano completo de extremo a extremo.

### Fase 3 — API para agentes

- Service accounts, emisión, rotación y revocación de API keys.
- Endpoints `/api/v1`, scopes y grants por proyecto.
- OpenAPI, idempotencia, cursores, control de concurrencia y rate limits.
- Suite de pruebas de contrato y ejemplos `curl`/TypeScript/Python.

**Salida:** un agente puede crear y gestionar incidencias sin acceso fuera de sus proyectos.

### Fase 4 — Webhooks y adjuntos

- Suscripciones por proyecto y evento.
- Firma HMAC, reintentos exponenciales y dead-letter queue.
- Carga directa a almacenamiento de objetos, validación de tipo/tamaño y antivirus.

**Salida:** integraciones salientes fiables y adjuntos seguros.

### Fase 5 — Endurecimiento y lanzamiento

- Threat modeling con foco en IDOR/BOLA, XSS, CSRF, SSRF y abuso de API keys.
- Pruebas E2E, carga, restauración de backup y rotación de secretos.
- Política de retención, exportación y borrado.
- Dashboards y alertas de seguridad/operación.

**Salida:** release candidata con checklist de producción aprobado.

## 8. Criterios de aceptación del MVP

- Un usuario sin membresía no puede detectar ni acceder a un proyecto por UI o API.
- Cambiar un `projectId` o `issueKey` manualmente nunca salta la autorización.
- Una API key revocada deja de funcionar inmediatamente.
- Una key de un proyecto no puede leer ni modificar incidencias de otro.
- Repetir un `POST` con la misma `Idempotency-Key` no duplica la incidencia.
- Toda acción sensible genera un evento de auditoría sin secretos ni contenido sensible innecesario.
- Dos ediciones concurrentes no se sobrescriben silenciosamente.
- Los backups se restauran en un entorno limpio mediante un procedimiento probado.
- OpenAPI coincide con el comportamiento real mediante tests de contrato.
- No existen endpoints de datos anónimos.

## 9. Pruebas mínimas

- Unitarias: transiciones, permisos, scopes, generación de claves e idempotencia.
- Integración: servicios contra PostgreSQL y transacciones.
- Contrato: cada operación OpenAPI con casos válidos y errores.
- E2E: login/MFA, proyecto, incidencia, comentarios y uso completo con API key.
- Seguridad: matriz de roles, IDOR entre proyectos, fuerza bruta, CSRF, XSS Markdown y filtración en logs.
- Operación: expiración/revocación, rate limiting, backups y fallos de webhook.

## 10. Riesgos y decisiones preventivas

- **Complejidad de permisos:** matriz pequeña y fija en MVP; tests por rol y operación.
- **Fuga entre proyectos:** scoping obligatorio en repositorios y autorización en servicios.
- **Keys expuestas:** secreto visible una vez, hash en reposo, expiración corta recomendada y rotación sin caída.
- **Agentes duplicando acciones:** idempotencia obligatoria y control optimista.
- **Markdown malicioso:** sanitización en servidor y CSP estricta.
- **Adjuntos peligrosos:** límites, URLs firmadas, almacenamiento privado y análisis antivirus.
- **SQLite en producción:** se descarta para este producto; PostgreSQL facilita concurrencia, backups y despliegue seguro.

## 11. Orden recomendado del backlog

1. Bootstrap, CI, PostgreSQL y observabilidad base.
2. Usuarios, sesiones, MFA y auditoría.
3. RBAC y matriz de permisos.
4. Proyectos y membresías.
5. Incidencias, transiciones e historial.
6. Tablero, filtros y comentarios.
7. Service accounts y API keys.
8. API v1 y OpenAPI.
9. Idempotencia, concurrencia y rate limits.
10. Webhooks.
11. Adjuntos.
12. Hardening, carga, backup/restore y lanzamiento.

## 12. Definición de terminado por historia

Una historia se considera terminada cuando incluye migración reversible, autorización en servidor, validación de entrada, auditoría cuando corresponda, pruebas unitarias/integración, actualización de OpenAPI si afecta el API, manejo de errores sin filtrar secretos y documentación operativa mínima.
