import path from "node:path";

export function resolveSqliteUrl(url: string, workingDirectory = process.cwd()) {
  if (!url.startsWith("file:./") && !url.startsWith("file:../")) return url;

  const relativePath = url.slice("file:".length);
  const absolutePath = path.resolve(workingDirectory, relativePath).replaceAll("\\", "/");
  return `file:${absolutePath}`;
}
