"use server";

import {
  createClassification,
  removeClassification,
  updateClassification,
  type ClassificationKind,
} from "@/modules/inventory/services/classifications.service";

function kind(formData: FormData) {
  const value = String(formData.get("kind"));
  if (!(["FAMILIA", "CATEGORIA", "MARCA"] as string[]).includes(value)) throw new Error("Clasificación inválida.");
  return value as ClassificationKind;
}

export async function createClassificationAction(formData: FormData) {
  await createClassification(kind(formData), String(formData.get("name") ?? ""), Number(formData.get("familyId")) || undefined);
}

export async function updateClassificationAction(formData: FormData) {
  await updateClassification(kind(formData), Number(formData.get("id")), String(formData.get("name") ?? ""), formData.get("active") === "on", Number(formData.get("familyId")) || undefined);
}

export async function removeClassificationAction(formData: FormData) {
  await removeClassification(kind(formData), Number(formData.get("id")));
}
