"use server";
import { deactivateUnit, saveUnit } from "@/modules/inventory/services/units.service";

export async function saveUnitAction(formData: FormData) {
  const id = Number(formData.get("id")) || undefined;
  await saveUnit({
    id,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    symbol: String(formData.get("symbol") ?? ""),
    precision: Number(formData.get("precision")),
    decimals: formData.get("decimals") === "on",
    active: id ? formData.get("active") === "on" : true,
  });
}

export async function deactivateUnitAction(formData: FormData) {
  await deactivateUnit(Number(formData.get("id")));
}
