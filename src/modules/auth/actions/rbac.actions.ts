"use server";

import {
  assignUserRoles as assignUserRolesService,
  createUser as createUserService,
  renameRole as renameRoleService,
  setRolePermissions as setRolePermissionsService,
} from "@/modules/auth/services/rbac.service";

export async function createUser(formData: FormData) {
  return createUserService(formData);
}

export async function renameRole(formData: FormData) {
  return renameRoleService(formData);
}

export async function setRolePermissions(formData: FormData) {
  return setRolePermissionsService(formData);
}

export async function assignUserRoles(formData: FormData) {
  return assignUserRolesService(formData);
}
