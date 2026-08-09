export function validatePushSubscription(input: { endpoint: string; p256dh: string; auth: string }) {
  if (!input.endpoint.startsWith("https://") || !input.p256dh || !input.auth) throw new Error("La suscripción push no es válida.");
  return input;
}

export function shouldDeactivateSubscription(status: number) {
  return status === 404 || status === 410;
}
