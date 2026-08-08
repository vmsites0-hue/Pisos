"use server";

import * as discountService from "@/modules/discounts/services/discounts.service";

export type { CartItemForDiscount } from "@/modules/discounts/services/discounts.service";
export const getReglasDescuento = discountService.getReglasDescuento;
export const createReglaDescuento = discountService.createReglaDescuento;
export const deleteReglaDescuento = discountService.deleteReglaDescuento;
export const toggleReglaDescuento = discountService.toggleReglaDescuento;
export const calcularDescuentoAutomatico = discountService.calcularDescuentoAutomatico;
