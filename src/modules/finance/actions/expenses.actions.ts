"use server";

import * as expenseService from "@/modules/finance/services/expenses.service";

export const registrarGasto = expenseService.registrarGasto;
export const eliminarGasto = expenseService.eliminarGasto;
