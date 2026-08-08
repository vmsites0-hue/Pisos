import { SucursalForm } from "@/modules/branches/components/SucursalForm";
import { ConfiguracionClient } from "@/modules/settings/components/ConfiguracionClient";
import { getSettingsPageData } from "@/modules/settings/repositories/settings.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { RbacSettings } from "@/modules/auth/components/RbacSettings";
import { getRbacSettingsData } from "@/modules/auth/repositories/rbac.repository";

export default async function ConfiguracionPage() {
  await requireAuthenticatedUser();
  const [{ branches, discountRules, categories }, rbac] = await Promise.all([
    getSettingsPageData(),
    getRbacSettingsData(),
  ]);

  return (
    <div className="space-y-4">
      <RbacSettings {...rbac} />
      <div className="flex justify-end">
        <SucursalForm />
      </div>
      <ConfiguracionClient
        sucursales={branches}
        reglas={discountRules}
        categories={categories}
      />
    </div>
  );
}
