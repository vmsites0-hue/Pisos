import Database from "better-sqlite3";
import { copyFile, mkdir, rename } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

export function sqlitePath(value = process.env.DATABASE_URL ?? "file:./dev.db") {
  if (!value.startsWith("file:")) throw new Error("DATABASE_URL debe usar file: para SQLite.");
  return resolve(value.slice(5));
}
export function assertHealthy(path) {
  const db = new Database(path, { readonly: true });
  try { if (db.pragma("quick_check", { simple: true }) !== "ok") throw new Error("La base no supera PRAGMA quick_check."); }
  finally { db.close(); }
}
export async function backup(source, directory) {
  assertHealthy(source); await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-"); const destination = resolve(directory, `${basename(source)}.${stamp}.backup`);
  const db = new Database(source); try { await db.backup(destination); } finally { db.close(); }
  assertHealthy(destination); return destination;
}
export async function restore(source, target) {
  assertHealthy(source); await mkdir(dirname(target), { recursive: true });
  const safety = `${target}.before-restore-${Date.now()}`;
  try { await copyFile(target, safety); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  const temporary = `${target}.restore-${Date.now()}`; await copyFile(source, temporary); assertHealthy(temporary); await rename(temporary, target); assertHealthy(target); return { target, safety };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const [command, first, second, confirmation] = process.argv.slice(2); const database = sqlitePath();
  if (command === "backup") console.log(await backup(first ? resolve(first) : database, second ? resolve(second) : resolve("backups")));
  else if (command === "restore") { if (confirmation !== "--confirm") throw new Error("Restaurar requiere: pnpm db:restore <backup> <destino> --confirm"); console.log(await restore(resolve(first), second ? resolve(second) : database)); }
  else throw new Error("Use backup o restore.");
}
