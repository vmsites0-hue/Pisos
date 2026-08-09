export function validateDeliveryFailure(input: { state: string; reason: string }) {
  if (input.state !== "EN_CAMINO") throw new Error("Solo una entrega en camino puede marcarse fallida.");
  if (!input.reason.trim()) throw new Error("El motivo de la entrega fallida es obligatorio.");
}
