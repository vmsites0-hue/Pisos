"use server";
import { createCreditPlan as createPlan } from "@/modules/credit/services/credit-plans.service";

export async function createCreditPlan(formData: FormData) { return createPlan(formData); }
