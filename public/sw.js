const CACHE = "erpiso-shell-v1";
const OFFLINE = "/offline";
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, "/manifest.webmanifest", "/icons/icon-192.svg"]))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "ERPiso", body: "Tenés una nueva notificación." };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/icon-192.svg", data: { url: data.url || "/notificaciones" } }));
});
self.addEventListener("notificationclick", (event) => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data.url)); });
