# Jira Clone — Gobernanza del proyecto

## 1. Propósito

Este documento define cómo se decide, construye, revisa, asegura y publica el Jira Clone. Aplica a código, infraestructura, documentación, esquemas de datos, API y dependencias.

## 2. Principios no negociables

1. Seguridad y aislamiento por proyecto prevalecen sobre velocidad de entrega.
2. El API publicado es un contrato; los cambios incompatibles requieren nueva versión.
3. No se integra código sin revisión independiente y quality gates verdes.
4. Ningún secreto ni dato personal real entra al repositorio o a fixtures.
5. Las decisiones relevantes quedan escritas y tienen responsable.
6. Producción se modifica mediante pipelines auditables, no manualmente salvo incidente.
7. Quien implementa una función no es la única persona que la aprueba.

## 3. Roles y responsabilidades

| Rol | Responsabilidad | Autoridad |
|---|---|---|
| Product Owner | Prioridad, alcance y aceptación funcional | Acepta historias y cambios de alcance |
| Tech Lead | Arquitectura, calidad técnica y mantenibilidad | Aprueba ADR y excepciones técnicas |
| Security Owner | Threat model, controles, vulnerabilidades e incidentes | Puede bloquear releases por riesgo |
| QA Owner | Estrategia, evidencia, regresión y flakiness | Aprueba evidencia de calidad |
| Maintainer | Revisión, integración y salud del repositorio | Aprueba PR según CODEOWNERS |
| Developer | Implementación, pruebas y documentación | Propone cambios; no autoaprueba |
| Release Manager | Release candidate, checklist y despliegue | Coordina publicación y rollback |
| Incident Commander | Dirección temporal de un incidente | Decide mitigación durante el incidente |

Una persona puede cubrir varios roles en un equipo pequeño, excepto que el autor de un cambio no puede ser su único revisor. Cambios de autenticación, autorización, API keys, criptografía o aislamiento requieren aprobación del Security Owner o delegado explícito.

## 4. RACI simplificado

| Decisión/actividad | PO | Tech Lead | Security | QA | Release Manager |
|---|---|---|---|---|---|
| Priorizar backlog | A/R | C | C | C | I |
| Cambiar arquitectura | C | A/R | C | C | I |
| Cambiar contrato API | A | R | C | C | I |
| Aceptar riesgo de seguridad | I | C | A/R | C | I |
| Aprobar calidad RC | C | C | C | A/R | I |
| Publicar/rollback | I | C | C | C | A/R |

`A`: accountable, `R`: responsible, `C`: consulted, `I`: informed.

## 5. Gestión del backlog

- La fuente de verdad es `JIRA_CLONE_BACKLOG.md` hasta migrarla a una herramienta.
- Cada ítem tiene ID estable, objetivo, prioridad, dependencias, aceptación y pruebas.
- Solo el Product Owner cambia prioridad o alcance funcional.
- Bugs de seguridad críticos/altos tienen prioridad sobre funcionalidad.
- Trabajo no planificado debe registrarse antes de integrarse, excepto mitigación urgente; en ese caso se documenta dentro de las siguientes 24 horas.
- Definition of Ready: objetivo claro, criterios verificables, dependencias disponibles, permisos/datos afectados identificados y estrategia de prueba conocida.

## 6. Decisiones de arquitectura

- Toda decisión difícil de revertir se registra como ADR en `docs/adr/NNNN-titulo.md`.
- Un ADR contiene contexto, decisión, alternativas, consecuencias, estado, autor y aprobadores.
- Estados: `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
- Tech Lead aprueba; Security Owner coaprueba si afecta fronteras de confianza, identidad, datos o exposición pública.
- No se reescriben ADR aceptados: se reemplazan con otro ADR que los referencia.

## 7. Gobierno del API

- OpenAPI 3.1 es la fuente canónica del API público.
- Todas las rutas externas viven bajo `/api/v1`.
- Cambios aditivos compatibles pueden entrar en v1 con documentación y pruebas.
- Eliminar/renombrar campos, endurecer validaciones existentes o cambiar semántica requiere `/api/v2` o un período de deprecación aprobado.
- Una deprecación se anuncia en documentación y headers, con fecha de retiro; plazo mínimo inicial: 90 días.
- Cada endpoint tiene owner, scopes explícitos, rate limit, errores estables y pruebas de contrato.
- El OpenAPI publicado se genera desde el mismo commit del despliegue.

## 8. Flujo de cambios

1. Historia lista y asignada.
2. Rama corta `feature/JC-US-####-slug`.
3. Implementación, pruebas, documentación y migración en el mismo PR.
4. CI completo y revisión CODEOWNERS.
5. Resolución de observaciones sin ocultar conversaciones.
6. Merge protegido; prohibido push directo a ramas estables.
7. Despliegue automático a staging y validación.
8. Inclusión en release candidate según prioridad y riesgo.

Se prefieren PR pequeños. Un cambio grande debe dividirse por comportamiento demostrable o usar feature flags seguros.

## 9. Quality gates

Para integrar un PR deben aprobarse:

- Lint, formato, TypeScript y build.
- Pruebas unitarias, integración y contrato afectadas.
- Matriz de endpoint completa si crea o cambia una ruta.
- Migración hacia adelante y compatibilidad/rollback revisados.
- Escaneo de secretos, dependencias, licencias y vulnerabilidades.
- Diff de OpenAPI revisado si corresponde.
- Revisión de autorización y aislamiento para toda entidad con `projectId`.
- Al menos un revisor independiente; dos para cambios críticos.

Excepciones requieren registro escrito con motivo, riesgo, mitigación, owner y vencimiento. Security Owner no puede ser omitido en excepciones de seguridad.

## 10. Política de pruebas

- Las pruebas pertenecen a la misma historia que la funcionalidad.
- Todo endpoint tiene casos exitosos, validación, autenticación, autorización, aislamiento y contrato.
- Comandos prueban idempotencia; mutaciones prueban concurrencia optimista.
- Los fixtures siempre incluyen al menos dos proyectos para detectar fugas.
- Las pruebas flaky bloquean si afectan seguridad o caminos críticos; las restantes tienen cuarentena máxima de 48 horas.
- El QA Owner publica evidencia de regresión para cada release candidate.

## 11. Gobierno de seguridad

- Threat model revisado en cada cambio de frontera de confianza y antes de cada release mayor.
- Vulnerabilidades críticas: mitigación inmediata y release bloqueada.
- Altas: corregir antes del release; excepción solo con aceptación escrita del Security Owner y Tech Lead.
- Medias: owner y fecha; bajas: backlog priorizado.
- Rotación de secretos ante sospecha, salida de personal con acceso o calendario definido.
- Principio de mínimo privilegio en producción y accesos con identidad individual/MFA.
- Auditoría de accesos administrativos y cambios sensibles.
- Divulgación responsable mediante canal privado documentado; nunca por un issue público con detalles explotables.

## 12. Datos, privacidad y retención

- Se recolecta la mínima información necesaria.
- Contraseñas, API keys, tokens MFA y recovery codes nunca se registran en logs.
- Backups cifrados y acceso auditado.
- Retención inicial: auditoría 365 días, sesiones vencidas 30 días, entregas de webhook 30 días y datos borrados lógicamente según política legal aplicable.
- Cambiar retención requiere Product Owner, Tech Lead y revisión legal/privacidad cuando corresponda.
- Datos de producción no se copian a desarrollo sin anonimización aprobada.

## 13. Dependencias y cadena de suministro

- Dependencias nuevas requieren justificación, licencia compatible, mantenimiento activo y evaluación de seguridad.
- Lockfile obligatorio y actualizaciones mediante PR revisable.
- SBOM por release y artefactos vinculados al commit/tag.
- No se ejecutan scripts o binarios descargados sin procedencia verificable.
- Vulnerabilidades de dependencias siguen los mismos SLA que código propio.

## 14. Releases

### Entrada a release candidate

- Alcance congelado y todas las historias P0 aceptadas.
- CI verde, migraciones listas y OpenAPI actualizado.
- Cero críticos/altos conocidos sin excepción aprobada.

### Aprobaciones obligatorias

- Product Owner: alcance y comportamiento.
- Tech Lead: arquitectura y operabilidad.
- QA Owner: regresión y evidencia.
- Security Owner: postura de seguridad.
- Release Manager: checklist, ventana y rollback.

### Salida

- Tag inmutable, changelog, artefactos/SBOM, migraciones y runbook.
- Despliegue observado durante la ventana acordada.
- Rollback iniciado si se superan umbrales de error, latencia o integridad.

## 15. Incidentes

- Severidad SEV-1 a SEV-4 según impacto, exposición y duración.
- SEV-1/SEV-2 designan Incident Commander y canal único de coordinación.
- Primero contener y preservar evidencia; luego corregir.
- Comunicaciones con hechos, impacto, mitigación y próxima actualización.
- Postmortem sin culpa para SEV-1/SEV-2 dentro de cinco días hábiles, con acciones, owners y fechas.
- Secretos comprometidos se revocan/rotan antes de considerar resuelto el incidente.

## 16. Métricas de gobernanza

- Porcentaje de endpoints con matriz completa: objetivo 100 %.
- Tiempo de CI y tasa de flakiness.
- Change failure rate y tiempo medio de recuperación.
- Vulnerabilidades abiertas por severidad y edad.
- Incidentes de aislamiento entre proyectos: objetivo 0.
- Cobertura de restore probado y cumplimiento de RPO/RTO.
- Excepciones vencidas: objetivo 0.

Las métricas sirven para mejorar el sistema, no para evaluar productividad individual por cantidad de commits o tickets.

## 17. Revisión de esta gobernanza

- Revisión ordinaria trimestral y extraordinaria después de SEV-1, cambio regulatorio o cambio mayor de arquitectura.
- Cualquier miembro puede proponer cambios mediante PR.
- Product Owner y Tech Lead aprueban cambios generales; Security Owner y QA Owner coaprueban las secciones de su dominio.
- Toda excepción tiene vencimiento; ninguna excepción temporal se convierte silenciosamente en política permanente.

