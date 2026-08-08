"use server";

import * as branchService from "@/modules/branches/services/branches.service";

export const createSucursal = branchService.createSucursal;
export const updateSucursal = branchService.updateSucursal;
export const deleteSucursal = branchService.deleteSucursal;
export const toggleSucursal = branchService.toggleSucursal;
