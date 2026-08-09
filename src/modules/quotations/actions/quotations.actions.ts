"use server";

import * as quotationService from "@/modules/quotations/services/quotations.service";

export const crearPresupuesto = quotationService.crearPresupuesto;
export const actualizarPresupuesto = quotationService.actualizarPresupuesto;
export const recalcularPresupuesto = quotationService.recalcularPresupuesto;
export const compararVariacionesPresupuesto = quotationService.compararVariacionesPresupuesto;
export const eliminarPresupuesto = quotationService.eliminarPresupuesto;
