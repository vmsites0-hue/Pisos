export const RETURN_CONDITIONS = ["APTO", "DEFECTUOSO", "CUARENTENA"] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

export function inspectReturn(input: { sold: number; previouslyReturned: number; requested: number; condition: string; quarantineEnabled: boolean }) {
  if (!Number.isFinite(input.requested) || input.requested <= 0 || input.previouslyReturned + input.requested > input.sold + 0.000001) throw new Error("La cantidad devuelta supera la cantidad vendida.");
  if (!RETURN_CONDITIONS.includes(input.condition as ReturnCondition)) throw new Error("La condición de devolución es inválida.");
  if (input.condition === "CUARENTENA" && !input.quarantineEnabled) throw new Error("La cuarentena está deshabilitada.");
  return { availableIncrement: input.condition === "APTO" ? input.requested : 0, quarantineIncrement: input.condition === "CUARENTENA" ? input.requested : 0, lossQuantity: input.condition === "DEFECTUOSO" ? input.requested : 0 };
}
