import { SucursalForm } from "@/modules/branches/components/SucursalForm";
import { ConfiguracionClient } from "@/modules/settings/components/ConfiguracionClient";
import { getSettingsPageData } from "@/modules/settings/repositories/settings.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function ConfiguracionPage() {
  await requireAuthenticatedUser();
  const { branches, discountRules, categories } = await getSettingsPageData();

  return (
    <div className="space-y-4">
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
