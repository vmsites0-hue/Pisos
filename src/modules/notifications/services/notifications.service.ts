import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export async function listMyNotifications() {
  const user = await requireAuthenticatedUser();
  return prisma.notificacion.findMany({ where: { usuarioId: user.id }, orderBy: { creadaEn: "desc" }, take: 100 });
}

export async function markAsRead(id: number) {
  const user = await requireAuthenticatedUser();
  await prisma.notificacion.updateMany({ where: { id, usuarioId: user.id, leidaEn: null }, data: { leidaEn: new Date() } });
  revalidatePath("/notificaciones");
}

export async function markAllAsRead() {
  const user = await requireAuthenticatedUser();
  await prisma.notificacion.updateMany({ where: { usuarioId: user.id, leidaEn: null }, data: { leidaEn: new Date() } });
  revalidatePath("/notificaciones");
}
