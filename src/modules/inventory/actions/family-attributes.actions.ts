"use server";

import { deactivateFamilyAttribute, saveFamilyAttribute } from "@/modules/inventory/services/family-attributes.service";

export async function saveFamilyAttributeAction(formData: FormData) {
  const id = Number(formData.get("id")) || undefined;
  await saveFamilyAttribute({
    id,
    familyId: Number(formData.get("familyId")),
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? ""),
    required: formData.get("required") === "on",
    filterable: formData.get("filterable") === "on",
    identity: formData.get("identity") === "on",
    options: String(formData.get("options") ?? "").split(","),
    active: id ? formData.get("active") === "on" : true,
  });
}

export async function deactivateFamilyAttributeAction(formData: FormData) {
  await deactivateFamilyAttribute(Number(formData.get("id")));
}
