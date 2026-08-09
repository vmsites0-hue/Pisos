import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { validatePushSubscription } from "../domain/push-subscription";

export async function savePushSubscription(input: { endpoint: string; p256dh: string; auth: string; device?: string }) {
  const user = await requireAuthenticatedUser();
  const valid = validatePushSubscription(input);
  await prisma.suscripcionPush.upsert({ where: { endpoint: valid.endpoint }, update: { usuarioId: user.id, p256dh: valid.p256dh, auth: valid.auth, dispositivo: input.device, activa: true }, create: { usuarioId: user.id, endpoint: valid.endpoint, p256dh: valid.p256dh, auth: valid.auth, dispositivo: input.device } });
  return { success: true };
}

export async function disablePushSubscription(endpoint: string) {
  const user = await requireAuthenticatedUser();
  await prisma.suscripcionPush.updateMany({ where: { endpoint, usuarioId: user.id }, data: { activa: false } });
  return { success: true };
}
