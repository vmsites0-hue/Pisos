import { ApprovalsPage } from "@/modules/approvals/components/ApprovalsPage";
import { getApprovalsPageData } from "@/modules/approvals/repositories/approvals.repository";
import { PERMISSIONS } from "@/modules/auth/domain/permissions";
import { hasPermission } from "@/modules/auth/services/access.service";

export default async function AprobacionesPage() {
  const [data, canManagePolicy] = await Promise.all([
    getApprovalsPageData(),
    hasPermission(PERMISSIONS.APPROVALS_POLICY_MANAGE),
  ]);
  return <ApprovalsPage {...data} canManagePolicy={canManagePolicy} />;
}
