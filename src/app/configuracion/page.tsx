import { ConfiguracionClient } from "@/modules/settings/components/ConfiguracionClient";
import { getSettingsPageData } from "@/modules/settings/repositories/settings.repository";
import { requireAuthenticatedUser } from "@/modules/auth/services/session.service";
import { RbacSettings } from "@/modules/auth/components/RbacSettings";
import { getRbacSettingsData } from "@/modules/auth/repositories/rbac.repository";
import { SystemParameters } from "@/modules/settings/components/SystemParameters";
import { getSystemParameters } from "@/modules/settings/services/system-parameters.service";
import { ClassificationSettings } from "@/modules/inventory/components/ClassificationSettings";
import { getClassifications } from "@/modules/inventory/services/classifications.service";
import { FamilyAttributesSettings } from "@/modules/inventory/components/FamilyAttributesSettings";
import { getFamilyAttributes } from "@/modules/inventory/services/family-attributes.service";
import { UnitsSettings } from "@/modules/inventory/components/UnitsSettings";
import { getUnits } from "@/modules/inventory/services/units.service";
import { CreditPlanSettings } from "@/modules/credit/components/CreditPlanSettings";
import { getCreditPlans } from "@/modules/credit/services/credit-plans.service";

export default async function ConfiguracionPage() {
  await requireAuthenticatedUser();
  const [{ branches, discountRules, categories }, rbac, parameters, classifications, attributes, units, creditPlans] = await Promise.all([
    getSettingsPageData(),
    getRbacSettingsData(),
    getSystemParameters(),
    getClassifications(),
    getFamilyAttributes(),
    getUnits(),
    getCreditPlans(),
  ]);

  return (
    <div className="space-y-4">
      <RbacSettings {...rbac} />
      <SystemParameters parameters={parameters} />
      <ClassificationSettings {...classifications} />
      <FamilyAttributesSettings attributes={attributes} families={classifications.families} />
      <UnitsSettings units={units} />
      <CreditPlanSettings plans={creditPlans} />
      <ConfiguracionClient
        sucursales={branches}
        reglas={discountRules}
        categories={categories}
      />
    </div>
  );
}
