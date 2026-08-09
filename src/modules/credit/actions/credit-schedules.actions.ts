"use server";
import { simulateCredit as simulate } from "@/modules/credit/services/credit-schedules.service";
export async function simulateCredit(input: { planId: number; principal: number; firstDueDate?: string | null }) { return simulate(input); }
