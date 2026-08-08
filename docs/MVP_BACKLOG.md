# ERPiso — Backlog funcional del MVP

## 1. Objetivo

Construir un sistema web instalable como PWA para una empresa que vende pisos y productos relacionados. El MVP operará en un solo local, tendrá usuarios individuales, control de acceso RBAC, catálogo parametrizable, inventario, ventas, presupuestos, reservas, créditos, logística, finanzas y notificaciones push.

La facturación electrónica y la operación multisucursal quedan fuera del MVP. El modelo conservará `branchId` asignado automáticamente al local principal para facilitar una futura evolución multibranch, sin exponer funciones multisucursal en la interfaz.

## 2. Principios funcionales

1. Las reglas comerciales variables se implementan como parámetros, no como constantes en el código.
2. Las ventas confirmadas son inmutables; las correcciones se registran mediante cancelaciones, devoluciones o movimientos compensatorios.
3. Todo movimiento de inventario, dinero y aprobación conserva trazabilidad.
4. El stock disponible se calcula como `stock físico - stock reservado`.
5. Las conversiones y permisos se validan tanto en la interfaz como en el servidor.
6. Las operaciones sensibles requieren permisos RBAC y, cuando corresponda, aprobación de otro usuario autorizado.
7. La PWA será instalable y permitirá operación móvil online. Las ventas offline quedan fuera del MVP.

## 3. Prioridades

| Código | Significado |
|---|---|
| P0 | Imprescindible para utilizar el MVP |
| P1 | Importante para completar el flujo operativo |
| P2 | Conveniente, puede entregarse después del primer uso controlado |
| Fuera | No forma parte del MVP |

## 4. Épicas

| Épica | Nombre | Prioridad | Dependencias |
|---|---|---:|---|
| E00 | Base técnica y reorganización | P0 | — |
| E01 | Autenticación, RBAC y auditoría | P0 | E00 |
| E02 | Configuración comercial | P0 | E00, E01 |
| E03 | Catálogo parametrizable | P0 | E02 |
| E04 | Inventario y movimientos | P0 | E01, E03 |
| E05 | Reservas de stock | P0 | E04 |
| E06 | Clientes | P0 | E01 |
| E07 | Presupuestos | P0 | E03, E05, E06 |
| E08 | Promociones, precios y aprobaciones | P0 | E01, E03 |
| E09 | Punto de venta | P0 | E04, E06, E08 |
| E10 | Cancelaciones, devoluciones y pérdidas | P1 | E04, E09 |
| E11 | Créditos y cuentas por cobrar | P1 | E06, E09 |
| E12 | Logística y entregas | P0 | E01, E09 |
| E13 | Finanzas y caja | P0 | E09, E11 |
| E14 | PWA y notificaciones | P0 | E01, E05, E12 |
| E15 | Reportes y documentos | P1 | E07, E09, E12, E13 |
| E16 | Calidad, seguridad y despliegue | P0 | Todas las épicas P0 |

---

## E00 — Base técnica y reorganización

### US-0001 — Estructura modular

**Como** equipo de desarrollo, **quiero** separar el sistema por módulos de negocio **para** mantener y probar cada funcionalidad sin depender de componentes gigantes.

**Prioridad:** P0  
**Dependencias:** ninguna

**Criterios de aceptación:**

- Existen módulos separados para catálogo, inventario, clientes, presupuestos, ventas, descuentos, créditos, logística, finanzas, usuarios y notificaciones.
- Las páginas de Next.js coordinan módulos, pero no contienen reglas de negocio.
- Las acciones de servidor delegan cálculos y operaciones a servicios.
- El acceso a Prisma está aislado de los componentes visuales.
- Ningún componente nuevo concentra una pantalla operativa completa.

### US-0002 — Entorno reproducible

**Como** desarrollador, **quiero** instalar y ejecutar el proyecto de manera documentada **para** reproducir el entorno sin depender de archivos locales desconocidos.

**Prioridad:** P0

**Criterios de aceptación:**

- pnpm es el único gestor de paquetes documentado.
- Existe `.env.example` sin secretos.
- Prisma dispone de migraciones versionadas.
- Existe un `seed` para crear el local principal, configuración mínima, roles y usuario administrador inicial.
- La base de desarrollo con información operativa no se utiliza como mecanismo de despliegue.
- El README explica instalación, migración, seed, desarrollo, pruebas y compilación.

### US-0003 — Retirar simulación fiscal

**Como** administrador, **quiero** que el sistema no afirme emitir facturas electrónicas **para** evitar presentar comprobantes simulados como documentos fiscales.

**Prioridad:** P0

**Criterios de aceptación:**

- Se elimina el CDC aleatorio, timbrado fijo y cualquier confirmación falsa de SIFEN.
- El documento de venta se identifica como comprobante interno o recibo no fiscal.
- No aparece ninguna acción de factura electrónica en el MVP.

---

## E01 — Autenticación, RBAC y auditoría

### US-0101 — Usuarios individuales

**Como** empleado, **quiero** acceder con mi propia cuenta **para** que mis acciones queden identificadas.

**Prioridad:** P0

**Criterios de aceptación:**

- Cada usuario tiene nombre, correo o identificador, contraseña cifrada, estado y roles.
- Las rutas operativas requieren sesión.
- Un usuario inactivo no puede iniciar sesión.
- No existen contraseñas predeterminadas almacenadas en texto plano.

### US-0102 — Roles y permisos configurables

**Como** administrador, **quiero** asignar permisos a roles **para** controlar las operaciones sin modificar código.

**Prioridad:** P0

**Criterios de aceptación:**

- Existen usuarios, roles, permisos y relaciones entre ellos.
- Los roles iniciales son Administrador, Vendedor, Depósito, Logística, Chofer y Finanzas.
- Los permisos se verifican en el servidor, no solamente ocultando botones.
- Un usuario puede tener más de un rol.
- Los nombres de roles pueden modificarse sin alterar los permisos internos.

### US-0103 — Aprobaciones

**Como** empleado, **quiero** solicitar autorización para operaciones restringidas **para** continuar sin compartir credenciales.

**Prioridad:** P0

**Criterios de aceptación:**

- Se soportan solicitudes para descuento superior al límite, cambio de precio, ajuste negativo, cancelación, devolución y eliminación de gasto.
- Cada solicitud guarda solicitante, motivo, operación, valores, estado, aprobador y fechas.
- El solicitante no puede aprobar su propia solicitud por defecto; esta política es configurable.
- Rechazar una solicitud no ejecuta la operación.
- Aprobarla habilita una única ejecución y evita reutilizar la autorización.

### US-0104 — Auditoría

**Como** administrador, **quiero** consultar quién realizó una operación sensible **para** investigar diferencias y corregir procesos.

**Prioridad:** P0

**Criterios de aceptación:**

- Se auditan accesos, cambios de configuración, precios, inventario, reservas, ventas, aprobaciones, entregas, cobros y gastos.
- El registro incluye usuario, acción, entidad, identificador, fecha y datos relevantes anteriores y posteriores.
- Los empleados no pueden borrar registros de auditoría desde la aplicación.

---

## E02 — Configuración comercial

### US-0201 — Local principal y preparación multibranch

**Como** administrador, **quiero** operar con un único local **para** mantener sencillo el MVP sin bloquear una futura evolución.

**Prioridad:** P0

**Criterios de aceptación:**

- Existe un único local principal activo creado por seed.
- Las entidades operativas guardan `branchId` obligatorio y se les asigna automáticamente el local principal.
- No existen selectores, transferencias, consolidaciones ni administración multisucursal visibles.
- No se puede crear un segundo local desde la interfaz del MVP.

### US-0202 — Parámetros generales

**Como** administrador, **quiero** configurar valores comerciales **para** cambiar reglas sin desplegar código.

**Prioridad:** P0

**Criterios de aceptación:**

- Se administran moneda, precisión, impuestos, plazos predeterminados y comportamiento general de redondeo.
- Cada parámetro tiene tipo, validación, valor predeterminado y descripción.
- Los cambios quedan auditados.
- Las operaciones históricas conservan los valores usados al confirmarse.

---

## E03 — Catálogo parametrizable

### US-0301 — Familias, categorías y marcas

**Como** administrador, **quiero** clasificar productos **para** organizar pisos, juegos de baño y otros artículos.

**Prioridad:** P0

**Criterios de aceptación:**

- Se pueden crear, editar, activar y desactivar familias, categorías y marcas.
- Los productos pueden filtrarse por esas clasificaciones.
- No se permite eliminar una clasificación utilizada; se desactiva.

### US-0302 — Atributos por familia

**Como** administrador, **quiero** definir atributos por familia **para** representar medidas y características diferentes sin modificar el modelo en cada caso.

**Prioridad:** P0

**Criterios de aceptación:**

- Se pueden crear atributos de texto, número, selección y booleano.
- Se define si un atributo es obligatorio, filtrable y parte de la identidad de una variante.
- Pisos pueden utilizar ancho, largo, espesor, tono, calibre, color y acabado.
- Juegos de baño y otras familias pueden tener conjuntos de atributos diferentes.

### US-0303 — Productos y variantes

**Como** encargado de catálogo, **quiero** registrar variantes separadas **para** controlar correctamente precio e inventario de cada combinación comercial.

**Prioridad:** P0

**Criterios de aceptación:**

- Cada producto tiene código, nombre, familia, categoría, marca, descripción, estado e imágenes.
- Una variante contiene su combinación de atributos, código, código de barras y precios.
- Dos combinaciones que difieren en un atributo de identidad se registran como variantes diferentes.
- No se permiten códigos o códigos de barras duplicados.

### US-0304 — Imágenes

**Como** empleado, **quiero** ver imágenes de los productos **para** identificarlos con facilidad.

**Prioridad:** P1

**Criterios de aceptación:**

- Se pueden cargar imágenes desde el dispositivo.
- Existe una imagen principal y se admiten imágenes adicionales.
- El sistema valida formato y tamaño.
- Si no existe imagen, se muestra un marcador neutro.

### US-0305 — Unidades y presentaciones

**Como** administrador, **quiero** configurar unidades y presentaciones por producto **para** vender cajas, m², piezas, juegos u otras modalidades.

**Prioridad:** P0

**Criterios de aceptación:**

- Las unidades son parametrizables y definen símbolo, precisión y si admiten decimales.
- Cada variante tiene una unidad base de inventario.
- Se pueden crear presentaciones con unidad, factor de conversión, piezas y descripción.
- Se soportan las políticas `SOLO_CAJAS_COMPLETAS`, `CANTIDAD_EXACTA`, `CAJAS_Y_FRACCION`, `UNIDADES_ENTERAS` y `MULTIPLO_CONFIGURABLE`.
- La política predeterminada para pisos es `SOLO_CAJAS_COMPLETAS`.

### US-0306 — Conversión de cajas

**Como** vendedor, **quiero** ingresar los m² solicitados **para** que el sistema calcule la presentación real que debe venderse.

**Prioridad:** P0

**Criterios de aceptación:**

- Para una caja de 2,08 m² y una solicitud de 10 m², la política predeterminada calcula 5 cajas y 10,40 m².
- Se muestran cantidad solicitada, cajas requeridas y cantidad real.
- El cálculo respeta la precisión configurada.
- Cambiar la política del producto modifica el comportamiento sin cambios de código.
- El servidor repite y valida el cálculo antes de confirmar presupuesto, reserva o venta.

---

## E04 — Inventario y movimientos

### US-0401 — Existencias por variante

**Como** encargado de depósito, **quiero** consultar las existencias de cada variante **para** saber qué puede venderse.

**Prioridad:** P0

**Criterios de aceptación:**

- Se muestran stock físico, reservado, disponible y mínimo.
- El stock puede separarse por lote, tono y calibre cuando la familia lo requiera.
- No se mezclan automáticamente combinaciones diferentes en una misma línea de venta.
- Se muestra equivalencia entre unidad base y presentaciones.

### US-0402 — Movimientos de inventario

**Como** administrador, **quiero** que toda variación de stock genere un movimiento **para** mantener trazabilidad.

**Prioridad:** P0

**Criterios de aceptación:**

- Existen movimientos de ingreso, venta, reserva, liberación, ajuste, devolución y pérdida.
- Cada movimiento guarda cantidad, unidad base, usuario, motivo, referencia y saldo resultante.
- El stock no puede quedar negativo.
- Un ajuste negativo requiere permiso y, según configuración, aprobación.

### US-0403 — Stock mínimo

**Como** encargado, **quiero** recibir una alerta cuando el disponible alcance el mínimo **para** solicitar reposición.

**Prioridad:** P0

**Criterios de aceptación:**

- El mínimo se configura por variante.
- El dashboard muestra variantes críticas.
- Alcanzar el mínimo crea una notificación sin duplicarla continuamente.
- Recuperar stock y volver a caer por debajo permite generar un nuevo aviso.

### US-0404 — Remanentes y cajas abiertas

**Como** encargado, **quiero** distinguir presentaciones cerradas y remanentes cuando el producto admite fracciones **para** representar correctamente el stock físico.

**Prioridad:** P1

**Criterios de aceptación:**

- La función se activa únicamente para productos fraccionables.
- Se registran apertura de presentación, consumo y remanente.
- Los productos no fraccionables solo pueden vender múltiplos de presentaciones completas.

---

## E05 — Reservas de stock

### US-0501 — Reserva manual

**Como** empleado autorizado, **quiero** reservar manualmente los productos de un presupuesto **para** impedir que se vendan a otro cliente.

**Prioridad:** P0

**Criterios de aceptación:**

- Crear un presupuesto no reserva stock automáticamente.
- El empleado puede reservar todas o algunas líneas si tiene permiso.
- La reserva reduce disponible, pero no físico.
- No se puede reservar más stock que el disponible.
- Se registra quién creó la reserva.

### US-0502 — Reserva con o sin vencimiento

**Como** empleado autorizado, **quiero** elegir si una reserva vence **para** adaptar el compromiso comercial.

**Prioridad:** P0

**Criterios de aceptación:**

- Se permite seleccionar fecha de vencimiento o “sin vencimiento”.
- Existe una duración predeterminada parametrizable.
- Las reservas vencidas se liberan automáticamente mediante un proceso idempotente.
- La liberación crea movimiento y notifica al empleado responsable.

### US-0503 — Consumo y liberación

**Como** vendedor, **quiero** consumir la reserva al convertir el presupuesto en venta **para** evitar duplicar el descuento de stock.

**Prioridad:** P0

**Criterios de aceptación:**

- Convertir el presupuesto consume la reserva correspondiente.
- Cancelar o rechazar la operación permite liberarla según permiso.
- El sistema evita consumir una reserva vencida o ya utilizada.

---

## E06 — Clientes

### US-0601 — Gestión de clientes

**Como** vendedor, **quiero** administrar clientes **para** asociarlos a presupuestos, ventas, créditos y entregas.

**Prioridad:** P0

**Criterios de aceptación:**

- Se registran nombre, apellido o razón social, documento, RUC, teléfono, correo y dirección.
- Documento y RUC se validan para evitar duplicados cuando corresponda.
- Los clientes con historial se desactivan en vez de eliminarse.
- Se puede buscar por nombre, documento, RUC o teléfono.

---

## E07 — Presupuestos

### US-0701 — Crear y editar presupuesto

**Como** vendedor, **quiero** crear y editar presupuestos **para** presentar una propuesta comercial sin afectar stock automáticamente.

**Prioridad:** P0

**Criterios de aceptación:**

- El presupuesto guarda cliente, líneas, presentaciones, cantidades solicitadas y reales, precios, descuentos y total.
- Puede tener vencimiento o no tenerlo.
- Mientras no esté convertido o cancelado, puede editarse con auditoría.
- Se genera un documento imprimible no fiscal.

### US-0702 — Política de recálculo

**Como** vendedor, **quiero** configurar si un presupuesto se recalcula **para** decidir cómo tratar cambios comerciales.

**Prioridad:** P0

**Criterios de aceptación:**

- El presupuesto permite mantener valores, recalcular manualmente o recalcular al convertir.
- El comportamiento predeterminado conserva los valores originales.
- El recálculo solo cambia el presupuesto cuando existe una variación.

### US-0703 — Comparación de variaciones

**Como** vendedor, **quiero** conocer las diferencias al convertir un presupuesto **para** informar correctamente al cliente.

**Prioridad:** P0

**Criterios de aceptación:**

- Se comparan precio, presentación, conversión, disponibilidad y descuentos.
- Si no hay variaciones, no se muestra advertencia.
- Si existen, se muestran valores anteriores, actuales y diferencia total.
- Según permiso, el usuario puede conservar valores, recalcular o cancelar la conversión.

### US-0704 — Conversión en venta

**Como** vendedor, **quiero** convertir un presupuesto en venta **para** evitar volver a cargar la operación.

**Prioridad:** P0

**Criterios de aceptación:**

- La conversión valida vigencia, variaciones, reserva, stock y permisos.
- Una conversión exitosa vincula presupuesto y venta.
- Un presupuesto no puede convertirse dos veces.

---

## E08 — Promociones, precios y aprobaciones

### US-0801 — Precios por presentación

**Como** administrador, **quiero** definir precios para presentaciones **para** vender correctamente por caja, m², unidad o juego.

**Prioridad:** P0

**Criterios de aceptación:**

- Se admite precio derivado por conversión o precio específico de presentación.
- Se conservan precio neto, impuesto, precio final y moneda.
- Cambiar un precio no altera operaciones confirmadas.

### US-0802 — Promociones parametrizables

**Como** administrador, **quiero** crear reglas de descuento **para** aplicar promociones por tipo de producto y condiciones comerciales.

**Prioridad:** P0

**Criterios de aceptación:**

- Una promoción puede limitarse por familia, categoría, marca, producto, variante, cantidad, monto, cliente y período.
- El motor evalúa reglas vigentes en el servidor.
- Si aplican varias promociones, utiliza la de mayor beneficio.
- La venta registra la regla aplicada y su importe.

### US-0803 — Descuento manual y cambio de precio

**Como** vendedor autorizado, **quiero** solicitar o aplicar excepciones **para** atender una negociación comercial controlada.

**Prioridad:** P0

**Criterios de aceptación:**

- El permiso y límite determinan si el vendedor puede aplicar directamente el descuento.
- Superar el límite crea una solicitud de aprobación.
- El cambio manual de precio requiere permiso o aprobación.
- Se registra precio original, precio final, motivo y responsables.

---

## E09 — Punto de venta

### US-0901 — Carrito y búsqueda

**Como** vendedor, **quiero** buscar variantes y agregarlas a una venta **para** atender al cliente con rapidez.

**Prioridad:** P0

**Criterios de aceptación:**

- Se busca por código, código de barras, nombre, marca, atributos y lote.
- Se muestra stock disponible y presentación.
- El carrito calcula conversiones, redondeo, promociones, impuestos y total.
- El vendedor no puede superar el disponible.

### US-0902 — Confirmar venta

**Como** vendedor, **quiero** confirmar una venta de forma atómica **para** evitar inconsistencias de stock y dinero.

**Prioridad:** P0

**Criterios de aceptación:**

- Se validan cliente, líneas, conversiones, stock, descuentos, permisos y método de pago en el servidor.
- Venta, detalles y movimientos de inventario se guardan en una transacción.
- Un error revierte completamente la operación.
- La venta guarda una fotografía de nombres, precios, impuestos, unidades y conversiones.

### US-0903 — Retiro o envío

**Como** vendedor, **quiero** indicar cómo se entrega la compra **para** iniciar el flujo correcto.

**Prioridad:** P0

**Criterios de aceptación:**

- Retiro y envío son opciones diferenciadas.
- Un envío crea una entrega pendiente.
- Se copian a la entrega nombre, teléfono y dirección vigentes.
- Un retiro no aparece como entrega domiciliaria pendiente.

### US-0904 — Comprobante interno

**Como** vendedor, **quiero** entregar un comprobante **para** resumir la operación sin presentarlo como factura fiscal.

**Prioridad:** P0

**Criterios de aceptación:**

- Incluye empresa, cliente, productos, presentaciones, cantidades, descuentos, impuestos, total, pago y modalidad.
- Se puede imprimir o descargar en PDF.
- Se identifica explícitamente como documento no fiscal cuando corresponda.

---

## E10 — Cancelaciones, devoluciones y pérdidas

### US-1001 — Cancelar venta

**Como** usuario autorizado, **quiero** cancelar una venta mediante movimientos compensatorios **para** corregirla sin borrar el historial.

**Prioridad:** P1

**Criterios de aceptación:**

- La venta original no se edita ni elimina.
- Se exige motivo y aprobación según política.
- Se revierten stock, cuenta por cobrar y movimientos financieros aplicables.
- Una venta entregada no se cancela; se procesa como devolución.

### US-1002 — Registrar devolución

**Como** empleado autorizado, **quiero** inspeccionar una devolución **para** decidir su destino.

**Prioridad:** P1

**Criterios de aceptación:**

- Se registra cantidad, motivo, condición, evidencia opcional y venta original.
- Un producto apto vuelve al disponible.
- Un producto defectuoso se registra como pérdida y no vuelve al disponible.
- Se admite estado de cuarentena configurable.

---

## E11 — Créditos y cuentas por cobrar

### US-1101 — Producto de crédito

**Como** administrador, **quiero** parametrizar planes de crédito **para** ofrecer financiación mensual.

**Prioridad:** P1

**Criterios de aceptación:**

- Se soportan sistemas francés y alemán.
- Se configuran tasa, número de cuotas, periodicidad, primera fecha y reglas de ajuste.
- Mora, pagos anticipados, tasa variable y recálculo son políticas configurables.
- Los cálculos monetarios utilizan precisión decimal adecuada y reglas de redondeo explícitas.

### US-1102 — Cronograma de cuotas

**Como** vendedor, **quiero** simular el crédito antes de confirmar **para** informar cuota, interés y total al cliente.

**Prioridad:** P1

**Criterios de aceptación:**

- Se muestra número, vencimiento, capital, interés, cuota y saldo.
- El cliente y vendedor pueden revisar el cronograma antes de confirmar.
- El cronograma confirmado queda asociado a la venta y no cambia sin una operación de recálculo autorizada.

### US-1103 — Cobro mensual

**Como** empleado de finanzas, **quiero** registrar pagos totales o parciales **para** actualizar la cuenta por cobrar.

**Prioridad:** P1

**Criterios de aceptación:**

- Se registran cobros por cuota, método de pago, usuario y fecha.
- Las cuotas admiten pendiente, pago parcial, pagada y vencida.
- Se distingue venta devengada, cuenta por cobrar y dinero cobrado.
- Confirmar una venta registra el ingreso comercial; la caja aumenta cuando se registra el cobro correspondiente.

---

## E12 — Logística y entregas

### US-1201 — Flujo de entrega

**Como** responsable de logística, **quiero** controlar los estados de una entrega **para** conocer su situación.

**Prioridad:** P0

**Criterios de aceptación:**

- Estados iniciales: pendiente, en preparación, listo para despacho, en camino, entregado, entrega fallida y cancelado.
- Cada transición registra usuario, fecha y observación.
- Las transiciones inválidas son rechazadas en el servidor.

### US-1202 — Asignación

**Como** usuario autorizado, **quiero** asignar encargado y chofer **para** responsabilizar a empleados concretos.

**Prioridad:** P0

**Criterios de aceptación:**

- Solo usuarios con `delivery.assign` pueden asignar.
- Encargado y chofer son usuarios individuales, no texto libre.
- La asignación queda auditada y notifica al empleado.

### US-1203 — Confirmar entrega

**Como** chofer, **quiero** confirmar la entrega desde el teléfono **para** cerrar el pedido.

**Prioridad:** P0

**Criterios de aceptación:**

- La confirmación del chofer es suficiente por defecto.
- Se registra fecha, usuario y observación.
- Se puede adjuntar imagen, pero no es obligatoria.
- Solo el chofer asignado o un usuario autorizado puede confirmar.

### US-1204 — Entrega fallida

**Como** chofer, **quiero** informar una entrega fallida **para** devolver el pedido al flujo operativo.

**Prioridad:** P0

**Criterios de aceptación:**

- Se exige motivo.
- La entrega conserva el intento fallido.
- El pedido regresa a preparación.
- El empleado responsable recibe una notificación.

### US-1205 — Nota de entrega

**Como** encargado, **quiero** imprimir una nota de entrega **para** acompañar la mercadería.

**Prioridad:** P1

**Criterios de aceptación:**

- Incluye cliente, teléfono, dirección, encargado, chofer, productos, cantidades y observaciones.
- Se puede imprimir y descargar.
- No se presenta como factura fiscal.

---

## E13 — Finanzas y caja

### US-1301 — Movimientos financieros

**Como** empleado de finanzas, **quiero** consultar movimientos de ingreso y egreso **para** conocer la situación operativa.

**Prioridad:** P0

**Criterios de aceptación:**

- Ventas, cobros, gastos, devoluciones y cancelaciones generan movimientos vinculados.
- Se distingue resultado comercial de flujo de caja.
- Los movimientos guardan método de pago, usuario, fecha y referencia.

### US-1302 — Gastos

**Como** empleado autorizado, **quiero** registrar gastos **para** calcular el resultado del período.

**Prioridad:** P0

**Criterios de aceptación:**

- Se registran descripción, categoría, importe, método de pago, fecha y comprobante opcional.
- La eliminación requiere permiso o aprobación y genera auditoría.
- Los gastos confirmados no desaparecen sin dejar movimiento compensatorio.

### US-1303 — Resumen diario y general

**Como** administrador, **quiero** consultar ventas y gastos por período **para** conocer resultados diarios y generales.

**Prioridad:** P0

**Criterios de aceptación:**

- Se puede consultar hoy y un rango de fechas.
- Se muestran ventas brutas, descuentos, devoluciones, ventas netas, cobros, cuentas por cobrar, gastos y saldo de caja.
- Se puede filtrar por usuario y método de pago.
- El único local se asigna internamente sin mostrar un filtro multisucursal.

### US-1304 — Cierre de caja

**Como** empleado de finanzas, **quiero** cerrar la caja **para** comparar el importe esperado con el contado.

**Prioridad:** P1

**Criterios de aceptación:**

- El cierre registra período, responsable, importes esperados, declarados y diferencias.
- Un cierre confirmado no se edita sin una reapertura autorizada.

---

## E14 — PWA y notificaciones

### US-1401 — Instalación PWA

**Como** empleado, **quiero** instalar la aplicación **para** acceder desde teléfono, tablet o computadora.

**Prioridad:** P0

**Criterios de aceptación:**

- Existe manifiesto, iconos, nombre, tema y pantalla inicial.
- La aplicación es instalable en navegadores compatibles.
- Existe una pantalla de desconexión clara.
- Las operaciones comerciales requieren conexión en el MVP.

### US-1402 — Suscripción push

**Como** empleado, **quiero** habilitar notificaciones en mi dispositivo **para** recibir tareas asignadas.

**Prioridad:** P0

**Criterios de aceptación:**

- El permiso se solicita después de una acción explícita del usuario.
- Las suscripciones pertenecen al usuario y dispositivo.
- El usuario puede desactivarlas.
- Las suscripciones inválidas se desactivan sin bloquear el evento de negocio.

### US-1403 — Centro de notificaciones

**Como** empleado, **quiero** consultar mis avisos **para** recuperar información aunque no haya visto el push.

**Prioridad:** P0

**Criterios de aceptación:**

- Se muestran avisos leídos y no leídos.
- Cada aviso enlaza directamente con su operación.
- Marcar un aviso como leído no altera el estado de la tarea.

### US-1404 — Eventos iniciales

**Como** empleado asignado, **quiero** recibir avisos relevantes **para** actuar a tiempo.

**Prioridad:** P0

**Criterios de aceptación:**

- Se notifican nuevo pedido, asignación de entrega, pedido listo, stock crítico, reserva próxima a vencer, reserva liberada, solicitud de aprobación, resultado de aprobación, variación de presupuesto y entrega fallida.
- El destinatario predeterminado es el empleado asignado.
- No se envían notificaciones masivas si existe un responsable concreto.
- Cada evento evita duplicados mediante una clave idempotente.

---

## E15 — Reportes y documentos

### US-1501 — Exportaciones

**Como** administrador, **quiero** exportar información **para** analizarla o compartirla.

**Prioridad:** P1

**Criterios de aceptación:**

- Se exportan inventario, ventas, gastos, cuentas por cobrar y entregas.
- Los filtros aplicados se respetan en el archivo.
- Los formatos iniciales son PDF para documentos y XLSX o CSV para datos.

---

## E16 — Calidad, seguridad y despliegue

### US-1601 — Pruebas de reglas críticas

**Como** responsable del producto, **quiero** pruebas automatizadas **para** evitar errores en cálculos y movimientos.

**Prioridad:** P0

**Criterios de aceptación:**

- Existen pruebas unitarias para conversiones, redondeo, descuentos, cuotas francesas y alemanas.
- Existen pruebas de integración para venta, reserva, vencimiento, cancelación, devolución, entrega y cobro.
- Se prueba específicamente 10 m² con cajas de 2,08 m², cuyo resultado predeterminado debe ser 5 cajas y 10,40 m².
- Se prueban permisos y aprobaciones en el servidor.

### US-1602 — Integridad y concurrencia

**Como** administrador, **quiero** operaciones consistentes **para** evitar vender o reservar dos veces el mismo stock.

**Prioridad:** P0

**Criterios de aceptación:**

- Las ventas y reservas utilizan transacciones.
- Dos operaciones concurrentes no pueden consumir el mismo disponible.
- Los procesos de vencimiento y notificación son idempotentes.

### US-1603 — Respaldo y despliegue

**Como** administrador, **quiero** respaldos y recuperación documentados **para** proteger la operación.

**Prioridad:** P0

**Criterios de aceptación:**

- Existe un entorno de producción separado del desarrollo.
- Los secretos se administran fuera del repositorio.
- Hay copia de seguridad programada y procedimiento probado de restauración.
- Se documentan despliegue, migraciones, rollback y monitoreo básico.

---

## 5. Secuencia sugerida de entregas

| Entrega | Contenido | Resultado demostrable |
|---|---|---|
| M1 | E00–E02 | Proyecto reorganizado, autenticación, RBAC, auditoría y configuración base |
| M2 | E03 | Familias, atributos, variantes, unidades, presentaciones y cajas de 2,08 m² |
| M3 | E04–E05 | Inventario trazable, stock mínimo, reservas manuales y liberación automática |
| M4 | E06–E09 | Clientes, presupuestos, variaciones, promociones, aprobaciones y ventas |
| M5 | E12–E14 | Operación móvil, entregas, PWA y notificaciones push |
| M6 | E10–E11, E13 | Devoluciones, pérdidas, crédito y finanzas generales |
| M7 | E15–E16 | Documentos, exportaciones, pruebas, seguridad y despliegue |

## 6. Dependencias críticas

1. RBAC y auditoría deben existir antes de implementar aprobaciones operativas.
2. Unidades, presentaciones y conversiones deben estabilizarse antes de inventario, presupuestos y ventas.
3. Los movimientos de inventario deben existir antes de reservas, cancelaciones y devoluciones.
4. La venta debe generar una entrega antes de construir la experiencia móvil de logística.
5. Los usuarios individuales y asignaciones deben existir antes de notificaciones push dirigidas.
6. El modelo de movimientos financieros debe preceder al motor de créditos y cierre de caja.

## 7. Definición de terminado del MVP

El MVP se considera terminado cuando, en un entorno similar a producción, se puede:

1. Crear usuarios y limitar acciones mediante roles y permisos.
2. Crear una familia de pisos con atributos y variantes independientes.
3. Configurar una caja de 2,08 m² y políticas alternativas de venta.
4. Solicitar 10 m² y obtener por defecto 5 cajas y 10,40 m².
5. Registrar stock físico y consultar reservado y disponible.
6. Crear una reserva manual con o sin vencimiento y liberarla automáticamente.
7. Crear un presupuesto y mostrar diferencias solo cuando existan variaciones.
8. Aplicar la mejor promoción y solicitar aprobación para una excepción.
9. Confirmar una venta sin permitir stock negativo ni operaciones parciales.
10. Convertir una venta con envío en una tarea logística asignada.
11. Recibir el push en la PWA y confirmar la entrega desde el teléfono.
12. Registrar una entrega fallida y devolverla a preparación.
13. Cancelar o devolver sin modificar la venta original.
14. Enviar productos aptos al stock y defectuosos a pérdida.
15. Crear un crédito francés o alemán y registrar pagos mensuales.
16. Consultar ventas, cobros, cuentas por cobrar, gastos y resultado por período.
17. Auditar usuarios, aprobaciones, inventario, ventas, entregas y finanzas.
18. Ejecutar pruebas, respaldo y restauración documentados.

## 8. Fuera del MVP

- Facturación electrónica SIFEN.
- Administración de múltiples sucursales.
- Transferencias entre sucursales.
- Operación comercial offline.
- Seguimiento GPS permanente.
- Optimización automática de rutas.
- Nómina y control horario.
- Comercio electrónico.
- Integraciones bancarias automáticas.
- Contabilidad fiscal completa.
