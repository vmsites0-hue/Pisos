import { randomBytes, scryptSync } from "node:crypto";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@erpiso.local";
const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error("SEED_ADMIN_PASSWORD es obligatoria para ejecutar el seed.");
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const permissions = [
  ["users.manage", "Administrar usuarios"],
  ["roles.manage", "Administrar roles y permisos"],
  ["branches.manage", "Administrar el local"],
  ["customers.manage", "Administrar clientes"],
  ["products.manage", "Administrar productos y categorías"],
  ["inventory.adjust", "Realizar ajustes de inventario"],
  ["quotations.manage", "Administrar presupuestos"],
  ["sales.create", "Confirmar ventas"],
  ["discounts.manage", "Administrar promociones"],
  ["logistics.update", "Actualizar entregas"],
  ["expenses.create", "Registrar gastos"],
  ["expenses.delete", "Eliminar gastos"],
  ["payments.create", "Registrar cobros"],
  ["approvals.review", "Aprobar o rechazar operaciones restringidas"],
  ["approvals.policy.manage", "Configurar políticas de aprobación"],
  ["audit.view", "Consultar registros de auditoría"],
  ["settings.manage", "Administrar parámetros generales"],
];

const roles = [
  ["ADMINISTRADOR", "Administrador"],
  ["VENDEDOR", "Vendedor"],
  ["DEPOSITO", "Depósito"],
  ["LOGISTICA", "Logística"],
  ["CHOFER", "Chofer"],
  ["FINANZAS", "Finanzas"],
];

const rolePermissions = {
  ADMINISTRADOR: permissions.map(([code]) => code),
  VENDEDOR: ["customers.manage", "quotations.manage", "sales.create"],
  DEPOSITO: ["products.manage", "inventory.adjust"],
  LOGISTICA: ["logistics.update"],
  CHOFER: ["logistics.update"],
  FINANZAS: ["expenses.create", "expenses.delete", "payments.create"],
};

async function main() {
  let mainBranch = await prisma.sucursal.findFirst({
    where: { esPrincipal: true },
  });

  if (!mainBranch) {
    mainBranch = await prisma.sucursal.create({
      data: {
        nombre: "Local principal",
        activa: true,
        esPrincipal: true,
      },
    });
  } else if (!mainBranch.activa) {
    mainBranch = await prisma.sucursal.update({
      where: { id: mainBranch.id },
      data: { activa: true },
    });
  }

  for (const name of ["Pisos", "Juegos de baño", "Griferías", "Adhesivos", "Otros"]) {
    await prisma.categoria.upsert({
      where: { nombre: name },
      update: {},
      create: { nombre: name },
    });
  }

  for (const [code, description] of permissions) {
    await prisma.permiso.upsert({
      where: { codigo: code },
      update: { descripcion: description },
      create: { codigo: code, descripcion: description },
    });
  }

  for (const [code, name] of roles) {
    const role = await prisma.rol.upsert({
      where: { codigo: code },
      update: { nombre: name },
      create: { codigo: code, nombre: name },
    });
    const assignedPermissions = rolePermissions[code] ?? [];

    for (const permissionCode of assignedPermissions) {
      const permission = await prisma.permiso.findUniqueOrThrow({
        where: { codigo: permissionCode },
      });
      await prisma.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: role.id, permisoId: permission.id } },
        update: {},
        create: { rolId: role.id, permisoId: permission.id },
      });
    }
  }

  let admin = await prisma.usuario.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    admin = await prisma.usuario.create({
      data: {
        nombre: adminName,
        email: adminEmail,
        password: hashPassword(adminPassword),
        sucursalId: mainBranch.id,
        activo: true,
      },
    });
  }

  const adminRole = await prisma.rol.findUniqueOrThrow({
    where: { codigo: "ADMINISTRADOR" },
  });
  await prisma.usuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: admin.id, rolId: adminRole.id } },
    update: {},
    create: { usuarioId: admin.id, rolId: adminRole.id },
  });

  await prisma.politicaAprobacion.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, permitirAutoAprobacion: false },
  });

  const systemParameters = [
    ["MONEDA", "STRING", "PYG", "Moneda usada en precios y totales", { options: ["PYG", "USD"] }],
    ["PRECISION_DECIMALES", "NUMBER", "2", "Cantidad de decimales para cantidades", { min: 0, max: 4, integer: true }],
    ["IMPUESTO_PORCENTAJE", "NUMBER", "10", "Porcentaje impositivo informativo", { min: 0, max: 100 }],
    ["PRESUPUESTO_VALIDEZ_DIAS", "NUMBER", "15", "Vigencia predeterminada de presupuestos", { min: 0, max: 365, integer: true }],
    ["REDONDEO_MODO", "STRING", "NEAREST", "Modo general de redondeo", { options: ["NEAREST", "UP", "DOWN"] }],
  ];
  for (const [key, type, defaultValue, description, validation] of systemParameters) {
    await prisma.parametroSistema.upsert({
      where: { clave: key },
      update: { tipo: type, valorPredeterminado: defaultValue, descripcion: description, validacion: JSON.stringify(validation) },
      create: { clave: key, tipo: type, valor: defaultValue, valorPredeterminado: defaultValue, descripcion: description, validacion: JSON.stringify(validation) },
    });
  }

  console.info(`Seed completado. Local principal: ${mainBranch.nombre}. Admin: ${adminEmail}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
