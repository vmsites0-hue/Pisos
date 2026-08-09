import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/modules/auth/domain/password";
import { recordAudit } from "@/modules/audit/services/audit.service";

const SESSION_COOKIE = "erpiso_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticate(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });

  if (!user || !user.activo || !(await verifyPassword(password, user.password))) {
    await recordAudit({ action: "LOGIN_RECHAZADO", entity: "Usuario", entityId: normalizedEmail });
    return null;
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.sesion.create({
    data: { tokenHash: hashToken(token), usuarioId: user.id, expiraEn: expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  await recordAudit({ userId: user.id, action: "LOGIN_EXITOSO", entity: "Usuario", entityId: user.id });

  return user;
}

export async function getAuthenticatedUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.sesion.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: true },
  });

  if (!session || session.expiraEn <= new Date() || !session.usuario.activo) {
    return null;
  }

  return session.usuario;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return user;
}

export async function closeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const session = await prisma.sesion.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { usuarioId: true },
    });
    await prisma.sesion.deleteMany({ where: { tokenHash: hashToken(token) } });
    if (session) {
      await recordAudit({ userId: session.usuarioId, action: "LOGOUT", entity: "Usuario", entityId: session.usuarioId });
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}
