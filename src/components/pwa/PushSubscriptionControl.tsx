"use client";
import { useState } from "react";
import { disablePushSubscription, savePushSubscription } from "@/modules/notifications/actions/push-subscriptions.actions";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function PushSubscriptionControl() {
  const [message, setMessage] = useState("");
  async function enable() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setMessage("Push no compatible.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setMessage("Permiso no concedido.");
    const registration = await navigator.serviceWorker.ready;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return setMessage("Falta configurar la clave VAPID pública.");
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    const json = subscription.toJSON();
    await savePushSubscription({ endpoint: subscription.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "", device: navigator.userAgent });
    setMessage("Notificaciones activadas.");
  }
  async function disable() {
    const subscription = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (subscription) { await disablePushSubscription(subscription.endpoint); await subscription.unsubscribe(); }
    setMessage("Notificaciones desactivadas.");
  }
  return <div className="flex items-center gap-1"><button type="button" onClick={enable} className="rounded border px-2 py-1 text-[10px]">Activar avisos</button><button type="button" onClick={disable} className="rounded border px-2 py-1 text-[10px]">Desactivar</button>{message && <span className="max-w-40 text-[9px] text-slate-500">{message}</span>}</div>;
}
