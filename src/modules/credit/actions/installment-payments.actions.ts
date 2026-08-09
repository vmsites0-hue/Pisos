"use server";
import { registerInstallmentPayment as registerPayment } from "@/modules/credit/services/installment-payments.service";
export async function registerInstallmentPayment(formData: FormData) { return registerPayment({ installmentId: Number(formData.get("installmentId")), amount: Number(formData.get("amount")), paymentMethod: String(formData.get("paymentMethod") ?? "EFECTIVO") }); }
