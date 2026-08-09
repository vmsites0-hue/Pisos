export const PERMISSIONS = {
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  BRANCHES_MANAGE: "branches.manage",
  CUSTOMERS_MANAGE: "customers.manage",
  PRODUCTS_MANAGE: "products.manage",
  INVENTORY_ADJUST: "inventory.adjust",
  QUOTATIONS_MANAGE: "quotations.manage",
  SALES_CREATE: "sales.create",
  DISCOUNTS_MANAGE: "discounts.manage",
  LOGISTICS_UPDATE: "logistics.update",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_DELETE: "expenses.delete",
  PAYMENTS_CREATE: "payments.create",
  APPROVALS_REVIEW: "approvals.review",
  APPROVALS_POLICY_MANAGE: "approvals.policy.manage",
  AUDIT_VIEW: "audit.view",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
