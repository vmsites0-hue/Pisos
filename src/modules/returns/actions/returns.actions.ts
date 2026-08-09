"use server";
import { registerReturn } from "@/modules/returns/services/returns.service";

export async function registerReturnAction(formData: FormData) {
  return registerReturn({ saleId: Number(formData.get("saleId")), saleDetailId: Number(formData.get("saleDetailId")), quantity: Number(formData.get("quantity")), condition: String(formData.get("condition") ?? ""), reason: String(formData.get("reason") ?? ""), evidenceUrl: String(formData.get("evidenceUrl") ?? "") || null, approvalId: Number(formData.get("approvalId")) || null });
}
