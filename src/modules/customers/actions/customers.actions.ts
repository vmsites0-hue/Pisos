"use server";

import * as customerService from "@/modules/customers/services/customers.service";

export const createCliente = customerService.createCliente;
export const updateCliente = customerService.updateCliente;
export const deleteCliente = customerService.deleteCliente;
