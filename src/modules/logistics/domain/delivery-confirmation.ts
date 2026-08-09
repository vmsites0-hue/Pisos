export function canConfirmDelivery(input: { actorId: number; assignedDriverId: number | null; canConfirmAny: boolean }) { return input.canConfirmAny || input.assignedDriverId === input.actorId; }
