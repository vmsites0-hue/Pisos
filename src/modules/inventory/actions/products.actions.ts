"use server";

import * as productService from "@/modules/inventory/services/products.service";

export const createProducto = productService.createProducto;
export const updateProducto = productService.updateProducto;
export const deleteProducto = productService.deleteProducto;
