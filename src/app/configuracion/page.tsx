import { SucursalForm } from "@/modules/branches/components/SucursalForm";
import { ConfiguracionClient } from "@/modules/settings/components/ConfiguracionClient";
import { getSettingsPageData } from "@/modules/settings/repositories/settings.repository";

export default async function ConfiguracionPage() {
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
