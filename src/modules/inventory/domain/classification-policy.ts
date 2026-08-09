export type ClassificationRemoval = "DELETE" | "DEACTIVATE";

export function classificationRemovalPolicy(usageCount: number): ClassificationRemoval {
  if (!Number.isInteger(usageCount) || usageCount < 0) throw new Error("El uso debe ser un entero no negativo.");
  return usageCount === 0 ? "DELETE" : "DEACTIVATE";
}
