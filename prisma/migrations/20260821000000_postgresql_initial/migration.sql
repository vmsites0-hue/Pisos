-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioRol" (
    "usuarioId" INTEGER NOT NULL,
    "rolId" INTEGER NOT NULL,

    CONSTRAINT "UsuarioRol_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "rolId" INTEGER NOT NULL,
    "permisoId" INTEGER NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudAprobacion" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "valoresAntes" TEXT,
    "valoresPropuestos" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "solicitanteId" INTEGER NOT NULL,
    "aprobadorId" INTEGER,
    "solicitadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltoEn" TIMESTAMP(3),
    "ejecutadoEn" TIMESTAMP(3),

    CONSTRAINT "SolicitudAprobacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliticaAprobacion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "permitirAutoAprobacion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PoliticaAprobacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametroSistema" (
    "clave" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "valorPredeterminado" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "validacion" TEXT NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametroSistema_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "datosAntes" TEXT,
    "datosDespues" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "familiaId" INTEGER,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Familia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtributoFamilia" (
    "id" SERIAL NOT NULL,
    "familiaId" INTEGER NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "filtrable" BOOLEAN NOT NULL DEFAULT false,
    "identidad" BOOLEAN NOT NULL DEFAULT false,
    "opciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AtributoFamilia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "marca" TEXT,
    "familiaId" INTEGER,
    "marcaId" INTEGER,
    "categoriaId" INTEGER NOT NULL,
    "unidadVenta" TEXT NOT NULL DEFAULT 'UNIDAD',
    "imagenUrl" TEXT,
    "m2PorCaja" DOUBLE PRECISION,
    "permiteFraccion" BOOLEAN NOT NULL DEFAULT false,
    "precioCompra" DOUBLE PRECISION NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoImagen" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "textoAlt" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductoImagen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VarianteProducto" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "nombre" TEXT,
    "precioCompra" DOUBLE PRECISION NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "unidadBaseId" INTEGER,
    "politicaVenta" TEXT NOT NULL DEFAULT 'UNIDADES_ENTERAS',
    "multiploVenta" DOUBLE PRECISION,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "VarianteProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 2,
    "admiteDecimales" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentacionVariante" (
    "id" SERIAL NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "unidadId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "factorConversion" DOUBLE PRECISION NOT NULL,
    "piezas" INTEGER,
    "descripcion" TEXT,
    "predeterminada" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "modoPrecio" TEXT NOT NULL DEFAULT 'DERIVADO',
    "precioNeto" DOUBLE PRECISION,
    "impuesto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioFinal" DOUBLE PRECISION,
    "moneda" TEXT NOT NULL DEFAULT 'PYG',

    CONSTRAINT "PresentacionVariante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VarianteAtributoValor" (
    "id" SERIAL NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "atributoId" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "VarianteAtributoValor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "loteTono" TEXT,
    "varianteId" INTEGER,
    "lote" TEXT,
    "tono" TEXT,
    "calibre" TEXT,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockReservado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertaMinimoActiva" BOOLEAN NOT NULL DEFAULT false,
    "alertaMinimoSecuencia" INTEGER NOT NULL DEFAULT 0,
    "presentacionesCerradas" INTEGER NOT NULL DEFAULT 0,
    "remanenteAbierto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockCuarentena" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoPresentacionInventario" (
    "id" SERIAL NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "remanenteAntes" DOUBLE PRECISION NOT NULL,
    "remanenteDespues" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoPresentacionInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" SERIAL NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "varianteId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidadBase" TEXT NOT NULL,
    "saldoAnterior" DOUBLE PRECISION NOT NULL,
    "saldoResultante" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" TEXT,
    "claveIdempotencia" TEXT NOT NULL,
    "leidaEn" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuscripcionPush" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "dispositivo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuscripcionPush_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PERSONA',
    "razonSocial" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "documento" TEXT NOT NULL,
    "ruc" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "limiteCredito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoDeudor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "presupuestoId" INTEGER,
    "reglaDescuentoId" INTEGER,
    "descuentoAutomatico" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "excepcionComercialSnapshot" TEXT NOT NULL DEFAULT '{}',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,
    "tipoEntrega" TEXT NOT NULL DEFAULT 'ENVIO',
    "chofer" TEXT,
    "observaciones" TEXT,
    "configuracionSnapshot" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelacionVenta" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "aprobacionId" INTEGER,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancelacionVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT,
    "direccion" TEXT,
    "observaciones" TEXT,
    "encargadoId" INTEGER,
    "choferId" INTEGER,
    "confirmadoPorId" INTEGER,
    "confirmadoEn" TIMESTAMP(3),
    "evidenciaUrl" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoEntrega" (
    "id" SERIAL NOT NULL,
    "entregaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "estadoAnterior" TEXT NOT NULL,
    "estadoNuevo" TEXT NOT NULL,
    "observacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleVenta" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "varianteId" INTEGER,
    "inventarioId" INTEGER,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "cantidadSolicitada" DOUBLE PRECISION,
    "cantidadPresentacion" DOUBLE PRECISION,
    "conversionSnapshot" TEXT NOT NULL DEFAULT '{}',
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "precioOriginal" DOUBLE PRECISION,
    "productoSnapshot" TEXT NOT NULL DEFAULT '{}',
    "impuesto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'PYG',
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetalleVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devolucion" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "aprobacionId" INTEGER,
    "motivo" TEXT NOT NULL,
    "evidenciaUrl" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleDevolucion" (
    "id" SERIAL NOT NULL,
    "devolucionId" INTEGER NOT NULL,
    "detalleVentaId" INTEGER NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "condicion" TEXT NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetalleDevolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "validezDias" INTEGER NOT NULL DEFAULT 15,
    "configuracionSnapshot" TEXT NOT NULL DEFAULT '{}',
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "venceEn" TIMESTAMP(3),
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "politicaRecalculo" TEXT NOT NULL DEFAULT 'CONSERVAR',

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetallePresupuesto" (
    "id" SERIAL NOT NULL,
    "presupuestoId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "varianteId" INTEGER,
    "presentacionId" INTEGER,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "cantidadSolicitada" DOUBLE PRECISION,
    "cantidadPresentacion" DOUBLE PRECISION,
    "conversionSnapshot" TEXT NOT NULL DEFAULT '{}',
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetallePresupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservaStock" (
    "id" SERIAL NOT NULL,
    "presupuestoId" INTEGER NOT NULL,
    "creadaPorId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,
    "venceEn" TIMESTAMP(3),
    "liberadaEn" TIMESTAMP(3),
    "motivoLiberacion" TEXT,

    CONSTRAINT "ReservaStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaReservaStock" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "detallePresupuestoId" INTEGER NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',

    CONSTRAINT "LineaReservaStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT,
    "metodoPago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "comprobanteUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "usuarioId" INTEGER,
    "anuladoEn" TIMESTAMP(3),
    "motivoAnulacion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreCaja" (
    "id" SERIAL NOT NULL,
    "periodoDesde" TIMESTAMP(3) NOT NULL,
    "periodoHasta" TIMESTAMP(3) NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "importeEsperado" DOUBLE PRECISION NOT NULL,
    "importeDeclarado" DOUBLE PRECISION NOT NULL,
    "diferencia" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CERRADO',
    "cerradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reabiertoEn" TIMESTAMP(3),
    "aprobacionReaperturaId" INTEGER,

    CONSTRAINT "CierreCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglaDescuento" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoriaId" INTEGER,
    "familiaId" INTEGER,
    "marcaId" INTEGER,
    "productoId" INTEGER,
    "varianteId" INTEGER,
    "clienteId" INTEGER,
    "vigenteDesde" TIMESTAMP(3),
    "vigenteHasta" TIMESTAMP(3),
    "umbralMinimo" DOUBLE PRECISION NOT NULL,
    "porcentajeDescuento" DOUBLE PRECISION NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReglaDescuento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCredito" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "sistema" TEXT NOT NULL,
    "tasaAnual" DOUBLE PRECISION NOT NULL,
    "numeroCuotas" INTEGER NOT NULL,
    "periodicidadMeses" INTEGER NOT NULL DEFAULT 1,
    "diasPrimeraCuota" INTEGER NOT NULL DEFAULT 30,
    "politicaAjuste" TEXT NOT NULL DEFAULT 'CUOTA_FIJA',
    "politicaMora" TEXT NOT NULL DEFAULT 'SIN_MORA',
    "politicaPagoAnticipado" TEXT NOT NULL DEFAULT 'REDUCIR_PLAZO',
    "tasaVariable" BOOLEAN NOT NULL DEFAULT false,
    "politicaRecalculo" TEXT NOT NULL DEFAULT 'AUTORIZADO',
    "moneda" TEXT NOT NULL DEFAULT 'PYG',
    "precisionMonetaria" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditoVenta" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "planCreditoId" INTEGER NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "interesTotal" DOUBLE PRECISION NOT NULL,
    "totalFinanciado" DOUBLE PRECISION NOT NULL,
    "saldoPendiente" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "planSnapshot" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuotaCredito" (
    "id" SERIAL NOT NULL,
    "creditoVentaId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "venceEn" TIMESTAMP(3) NOT NULL,
    "capital" DOUBLE PRECISION NOT NULL,
    "interes" DOUBLE PRECISION NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "CuotaCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoCuota" (
    "id" SERIAL NOT NULL,
    "cuotaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoCuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoFinanciero" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "afectaResultado" BOOLEAN NOT NULL,
    "afectaCaja" BOOLEAN NOT NULL,
    "metodoPago" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "referenciaTipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoFinanciero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_codigo_key" ON "Rol"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_codigo_key" ON "Permiso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_tokenHash_key" ON "Sesion"("tokenHash");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");

-- CreateIndex
CREATE INDEX "Sesion_expiraEn_idx" ON "Sesion"("expiraEn");

-- CreateIndex
CREATE INDEX "SolicitudAprobacion_estado_solicitadoEn_idx" ON "SolicitudAprobacion"("estado", "solicitadoEn");

-- CreateIndex
CREATE INDEX "SolicitudAprobacion_solicitanteId_idx" ON "SolicitudAprobacion"("solicitanteId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_entidad_entidadId_idx" ON "RegistroAuditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_usuarioId_creadoEn_idx" ON "RegistroAuditoria"("usuarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_creadoEn_idx" ON "RegistroAuditoria"("creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Familia_nombre_key" ON "Familia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "AtributoFamilia_familiaId_clave_key" ON "AtributoFamilia"("familiaId", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigo_key" ON "Producto"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigoBarras_key" ON "Producto"("codigoBarras");

-- CreateIndex
CREATE INDEX "ProductoImagen_productoId_orden_idx" ON "ProductoImagen"("productoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoImagen_productoId_url_key" ON "ProductoImagen"("productoId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "VarianteProducto_sku_key" ON "VarianteProducto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "VarianteProducto_codigoBarras_key" ON "VarianteProducto"("codigoBarras");

-- CreateIndex
CREATE INDEX "VarianteProducto_productoId_idx" ON "VarianteProducto"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_codigo_key" ON "UnidadMedida"("codigo");

-- CreateIndex
CREATE INDEX "PresentacionVariante_unidadId_idx" ON "PresentacionVariante"("unidadId");

-- CreateIndex
CREATE UNIQUE INDEX "PresentacionVariante_varianteId_nombre_key" ON "PresentacionVariante"("varianteId", "nombre");

-- CreateIndex
CREATE INDEX "VarianteAtributoValor_atributoId_idx" ON "VarianteAtributoValor"("atributoId");

-- CreateIndex
CREATE UNIQUE INDEX "VarianteAtributoValor_varianteId_atributoId_key" ON "VarianteAtributoValor"("varianteId", "atributoId");

-- CreateIndex
CREATE INDEX "Inventario_varianteId_sucursalId_lote_tono_calibre_idx" ON "Inventario"("varianteId", "sucursalId", "lote", "tono", "calibre");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_productoId_sucursalId_loteTono_key" ON "Inventario"("productoId", "sucursalId", "loteTono");

-- CreateIndex
CREATE INDEX "EventoPresentacionInventario_inventarioId_creadoEn_idx" ON "EventoPresentacionInventario"("inventarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "MovimientoInventario_inventarioId_creadoEn_idx" ON "MovimientoInventario"("inventarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "MovimientoInventario_varianteId_creadoEn_idx" ON "MovimientoInventario"("varianteId", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "Notificacion_claveIdempotencia_key" ON "Notificacion"("claveIdempotencia");

-- CreateIndex
CREATE INDEX "Notificacion_usuarioId_leidaEn_creadaEn_idx" ON "Notificacion"("usuarioId", "leidaEn", "creadaEn");

-- CreateIndex
CREATE UNIQUE INDEX "SuscripcionPush_endpoint_key" ON "SuscripcionPush"("endpoint");

-- CreateIndex
CREATE INDEX "SuscripcionPush_usuarioId_activa_idx" ON "SuscripcionPush"("usuarioId", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_documento_key" ON "Cliente"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_ruc_key" ON "Cliente"("ruc");

-- CreateIndex
CREATE INDEX "Cliente_sucursalId_idx" ON "Cliente"("sucursalId");

-- CreateIndex
CREATE INDEX "Cliente_activo_nombre_apellido_idx" ON "Cliente"("activo", "nombre", "apellido");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_presupuestoId_key" ON "Venta"("presupuestoId");

-- CreateIndex
CREATE UNIQUE INDEX "CancelacionVenta_ventaId_key" ON "CancelacionVenta"("ventaId");

-- CreateIndex
CREATE UNIQUE INDEX "Entrega_ventaId_key" ON "Entrega"("ventaId");

-- CreateIndex
CREATE INDEX "Entrega_estado_creadaEn_idx" ON "Entrega"("estado", "creadaEn");

-- CreateIndex
CREATE INDEX "EventoEntrega_entregaId_creadoEn_idx" ON "EventoEntrega"("entregaId", "creadoEn");

-- CreateIndex
CREATE INDEX "Devolucion_ventaId_creadaEn_idx" ON "Devolucion"("ventaId", "creadaEn");

-- CreateIndex
CREATE INDEX "DetalleDevolucion_detalleVentaId_idx" ON "DetalleDevolucion"("detalleVentaId");

-- CreateIndex
CREATE INDEX "Presupuesto_sucursalId_idx" ON "Presupuesto"("sucursalId");

-- CreateIndex
CREATE INDEX "Presupuesto_estado_venceEn_idx" ON "Presupuesto"("estado", "venceEn");

-- CreateIndex
CREATE INDEX "ReservaStock_presupuestoId_estado_idx" ON "ReservaStock"("presupuestoId", "estado");

-- CreateIndex
CREATE INDEX "ReservaStock_estado_venceEn_idx" ON "ReservaStock"("estado", "venceEn");

-- CreateIndex
CREATE INDEX "LineaReservaStock_detallePresupuestoId_estado_idx" ON "LineaReservaStock"("detallePresupuestoId", "estado");

-- CreateIndex
CREATE INDEX "LineaReservaStock_inventarioId_estado_idx" ON "LineaReservaStock"("inventarioId", "estado");

-- CreateIndex
CREATE INDEX "Gasto_sucursalId_idx" ON "Gasto"("sucursalId");

-- CreateIndex
CREATE INDEX "Gasto_usuarioId_fecha_idx" ON "Gasto"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "CierreCaja_periodoDesde_periodoHasta_idx" ON "CierreCaja"("periodoDesde", "periodoHasta");

-- CreateIndex
CREATE INDEX "CierreCaja_responsableId_cerradoEn_idx" ON "CierreCaja"("responsableId", "cerradoEn");

-- CreateIndex
CREATE INDEX "ReglaDescuento_sucursalId_idx" ON "ReglaDescuento"("sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditoVenta_ventaId_key" ON "CreditoVenta"("ventaId");

-- CreateIndex
CREATE INDEX "CuotaCredito_estado_venceEn_idx" ON "CuotaCredito"("estado", "venceEn");

-- CreateIndex
CREATE UNIQUE INDEX "CuotaCredito_creditoVentaId_numero_key" ON "CuotaCredito"("creditoVentaId", "numero");

-- CreateIndex
CREATE INDEX "PagoCuota_cuotaId_fecha_idx" ON "PagoCuota"("cuotaId", "fecha");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_creadoEn_categoria_idx" ON "MovimientoFinanciero"("creadoEn", "categoria");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_referenciaTipo_referenciaId_idx" ON "MovimientoFinanciero"("referenciaTipo", "referenciaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAprobacion" ADD CONSTRAINT "SolicitudAprobacion_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAprobacion" ADD CONSTRAINT "SolicitudAprobacion_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtributoFamilia" ADD CONSTRAINT "AtributoFamilia_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoImagen" ADD CONSTRAINT "ProductoImagen_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianteProducto" ADD CONSTRAINT "VarianteProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianteProducto" ADD CONSTRAINT "VarianteProducto_unidadBaseId_fkey" FOREIGN KEY ("unidadBaseId") REFERENCES "UnidadMedida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentacionVariante" ADD CONSTRAINT "PresentacionVariante_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentacionVariante" ADD CONSTRAINT "PresentacionVariante_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "UnidadMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianteAtributoValor" ADD CONSTRAINT "VarianteAtributoValor_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianteAtributoValor" ADD CONSTRAINT "VarianteAtributoValor_atributoId_fkey" FOREIGN KEY ("atributoId") REFERENCES "AtributoFamilia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoPresentacionInventario" ADD CONSTRAINT "EventoPresentacionInventario_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoPresentacionInventario" ADD CONSTRAINT "EventoPresentacionInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuscripcionPush" ADD CONSTRAINT "SuscripcionPush_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_reglaDescuentoId_fkey" FOREIGN KEY ("reglaDescuentoId") REFERENCES "ReglaDescuento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelacionVenta" ADD CONSTRAINT "CancelacionVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelacionVenta" ADD CONSTRAINT "CancelacionVenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_encargadoId_fkey" FOREIGN KEY ("encargadoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_choferId_fkey" FOREIGN KEY ("choferId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoEntrega" ADD CONSTRAINT "EventoEntrega_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "Entrega"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoEntrega" ADD CONSTRAINT "EventoEntrega_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleDevolucion" ADD CONSTRAINT "DetalleDevolucion_devolucionId_fkey" FOREIGN KEY ("devolucionId") REFERENCES "Devolucion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleDevolucion" ADD CONSTRAINT "DetalleDevolucion_detalleVentaId_fkey" FOREIGN KEY ("detalleVentaId") REFERENCES "DetalleVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleDevolucion" ADD CONSTRAINT "DetalleDevolucion_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePresupuesto" ADD CONSTRAINT "DetallePresupuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePresupuesto" ADD CONSTRAINT "DetallePresupuesto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePresupuesto" ADD CONSTRAINT "DetallePresupuesto_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePresupuesto" ADD CONSTRAINT "DetallePresupuesto_presentacionId_fkey" FOREIGN KEY ("presentacionId") REFERENCES "PresentacionVariante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaStock" ADD CONSTRAINT "ReservaStock_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaStock" ADD CONSTRAINT "ReservaStock_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaReservaStock" ADD CONSTRAINT "LineaReservaStock_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "ReservaStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaReservaStock" ADD CONSTRAINT "LineaReservaStock_detallePresupuestoId_fkey" FOREIGN KEY ("detallePresupuestoId") REFERENCES "DetallePresupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaReservaStock" ADD CONSTRAINT "LineaReservaStock_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "Inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreCaja" ADD CONSTRAINT "CierreCaja_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaDescuento" ADD CONSTRAINT "ReglaDescuento_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoVenta" ADD CONSTRAINT "CreditoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoVenta" ADD CONSTRAINT "CreditoVenta_planCreditoId_fkey" FOREIGN KEY ("planCreditoId") REFERENCES "PlanCredito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaCredito" ADD CONSTRAINT "CuotaCredito_creditoVentaId_fkey" FOREIGN KEY ("creditoVentaId") REFERENCES "CreditoVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "CuotaCredito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
