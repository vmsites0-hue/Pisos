import Database from "better-sqlite3";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = await mkdtemp(join(tmpdir(), "erpiso-migrations-"));
const target = join(root, "verification.db");
const db = new Database(target);
try {
  db.pragma("foreign_keys = ON");
  const directories = (await readdir(new URL("../prisma/migrations/", import.meta.url), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  for (const migration of directories) {
    const sql = await readFile(new URL(`../prisma/migrations/${migration}/migration.sql`, import.meta.url), "utf8");
    try { db.exec("BEGIN;\n" + sql + "\nCOMMIT;"); }
    catch (error) { try { db.exec("ROLLBACK;"); } catch {} throw new Error(`Falló ${migration}: ${error.message}`); }
  }
  const foreignKeys = db.pragma("foreign_key_check");
  const quickCheck = db.pragma("quick_check", { simple: true });
  if (foreignKeys.length || quickCheck !== "ok") throw new Error(`Integridad inválida: foreign_keys=${foreignKeys.length}, quick_check=${quickCheck}`);
  console.log(`OK: ${directories.length} migraciones; quick_check=${quickCheck}; foreign_key_violations=0`);
} finally { db.close(); await rm(root, { recursive: true, force: true }); }
