import { ConfiguracionClient } from "@/modules/settings/components/ConfiguracionClient";
import { getSettingsPageData } from "@/modules/settings/repositories/settings.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { RbacSettings } from "@/modules/auth/components/RbacSettings";
import { getRbacSettingsData } from "@/modules/auth/repositories/rbac.repository";
import { SystemParameters } from "@/modules/settings/components/SystemParameters";
import { getSystemParameters } from "@/modules/settings/services/system-parameters.service";

export default async function ConfiguracionPage() {
  await requireAuthenticatedUser();
  const [{ branches, discountRules, categories }, rbac, parameters] = await Promise.all([
    getSettingsPageData(),
    getRbacSettingsData(),
    getSystemParameters(),
  ]);

  return (
    <div className="space-y-4">
      <RbacSettings {...rbac} />
      <SystemParameters parameters={parameters} />
      <ConfiguracionClient
        sucursales={branches}
        reglas={discountRules}
        categories={categories}
      />
    </div>
  );
}
