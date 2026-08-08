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

async function main() {
  let mainBranch = await prisma.sucursal.findFirst({
    where: { nombre: "Local principal" },
  });

  if (!mainBranch) {
    mainBranch = await prisma.sucursal.create({
      data: {
        nombre: "Local principal",
        activa: true,
      },
    });
  }

  for (const name of ["Pisos", "Juegos de baño", "Griferías", "Adhesivos", "Otros"]) {
    await prisma.categoria.upsert({
      where: { nombre: name },
      update: {},
      create: { nombre: name },
    });
  }

  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.usuario.create({
      data: {
        nombre: adminName,
        email: adminEmail,
        password: hashPassword(adminPassword),
        rol: "ADMINISTRADOR",
        sucursalId: mainBranch.id,
        activo: true,
      },
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
