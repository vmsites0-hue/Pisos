"use server";
import { cancelSale } from "@/modules/returns/services/sale-cancellations.service";

export async function cancelSaleAction(formData: FormData) {
  return cancelSale({ saleId: Number(formData.get("saleId")), reason: String(formData.get("reason") ?? ""), approvalId: Number(formData.get("approvalId")) || null });
}
