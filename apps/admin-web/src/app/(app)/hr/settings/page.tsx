"use client";

import { CompanyHrSettings } from "@/components/hr/company-hr-settings";
import { PageHeader } from "@/components/layout/page-header";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { useI18n } from "@/i18n";

export default function HrSettingsPage() {
  const { t } = useI18n();
  return <PagePermissionGuard permissions={["hr.settings.view", "hr.manage"]}>
    <PageHeader title={t("hr.foundation.settings.title")} description={t("companySettings.pageDescription")} />
    <CompanyHrSettings />
  </PagePermissionGuard>;
}
