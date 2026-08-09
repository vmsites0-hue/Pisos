import { ConfiguracionClient } from "@/modules/settings/components/ConfiguracionClient";
import { getSettingsPageData } from "@/modules/settings/repositories/settings.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { RbacSettings } from "@/modules/auth/components/RbacSettings";
import { getRbacSettingsData } from "@/modules/auth/repositories/rbac.repository";
import { SystemParameters } from "@/modules/settings/components/SystemParameters";
import { getSystemParameters } from "@/modules/settings/services/system-parameters.service";
import { ClassificationSettings } from "@/modules/inventory/components/ClassificationSettings";
import { getClassifications } from "@/modules/inventory/services/classifications.service";

export default async function ConfiguracionPage() {
  await requireAuthenticatedUser();
  const [{ branches, discountRules, categories }, rbac, parameters, classifications] = await Promise.all([
    getSettingsPageData(),
    getRbacSettingsData(),
    getSystemParameters(),
    getClassifications(),
  ]);

  return (
    <div className="space-y-4">
      <RbacSettings {...rbac} />
      <SystemParameters parameters={parameters} />
      <ClassificationSettings {...classifications} />
      <ConfiguracionClient
        sucursales={branches}
        reglas={discountRules}
        categories={categories}
      />
    </div>
  );
}
