export type ExpenseState = "CONFIRMADO" | "ANULADO";

export function cancelExpense(state: ExpenseState, reason: string) {
  if (state !== "CONFIRMADO") throw new Error("El gasto ya fue anulado.");
  if (!reason.trim()) throw new Error("El motivo de anulacion es obligatorio.");
  return { state: "ANULADO" as const, reason: reason.trim() };
}
