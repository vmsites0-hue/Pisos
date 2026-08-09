"use server";

import * as quotationService from "@/modules/quotations/services/quotations.service";

export const crearPresupuesto = quotationService.crearPresupuesto;
export const actualizarPresupuesto = quotationService.actualizarPresupuesto;
export const eliminarPresupuesto = quotationService.eliminarPresupuesto;
