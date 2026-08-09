import type { Prisma } from "@prisma/client";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { shouldDeactivateSubscription } from "../domain/push-subscription";

export type NotificationInput = { userId: number; type: string; title: string; message: string; link?: string | null; idempotencyKey: string };

export function recordNotification(tx: Prisma.TransactionClient, input: NotificationInput) {
  return tx.notificacion.upsert({ where: { claveIdempotencia: input.idempotencyKey }, update: {}, create: { usuarioId: input.userId, tipo: input.type, titulo: input.title, mensaje: input.message, enlace: input.link, claveIdempotencia: input.idempotencyKey } });
}

async function deliverPush(input: NotificationInput) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@erpiso.local";
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const subscriptions = await prisma.suscripcionPush.findMany({ where: { usuarioId: input.userId, activa: true } });
  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: input.title, body: input.message, url: input.link }));
    } catch (error) {
      const status = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (shouldDeactivateSubscription(status)) await prisma.suscripcionPush.update({ where: { id: subscription.id }, data: { activa: false } });
    }
  }));
}

export async function notifyUser(input: NotificationInput) {
  await prisma.$transaction((tx) => recordNotification(tx, input));
  await deliverPush(input);
}
