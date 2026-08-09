export function allocateReservation(quantity: number, inventories: Array<{ id: number; physical: number; reserved: number }>) {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("La cantidad a reservar debe ser mayor que cero.");
  let pending = quantity;
  const allocations: Array<{ inventoryId: number; quantity: number }> = [];
  for (const inventory of inventories) {
    const available = Math.max(0, inventory.physical - inventory.reserved);
    const assigned = Math.min(available, pending);
    if (assigned > 0) allocations.push({ inventoryId: inventory.id, quantity: assigned });
    pending -= assigned;
    if (pending <= Number.EPSILON) break;
  }
  if (pending > Number.EPSILON) throw new Error("No hay stock disponible suficiente para la reserva.");
  return allocations;
}
