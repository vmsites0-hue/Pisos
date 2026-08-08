"use server";

import { registrarPagoCliente as registerCustomerPayment } from "@/modules/finance/services/payments.service";

export const registrarPagoCliente = registerCustomerPayment;
