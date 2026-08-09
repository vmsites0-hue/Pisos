"use server";

import { updateSystemParameter } from "@/modules/settings/services/system-parameters.service";

export async function updateSystemParameterAction(formData: FormData) {
  await updateSystemParameter(String(formData.get("key") ?? ""), String(formData.get("value") ?? ""));
}
