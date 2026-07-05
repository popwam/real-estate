"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function PlatformHrOverviewPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.hr.overview.4d1c415e")}
      description="Platform view of HR department foundations."
      listPath="/hr/departments"
      queryKey="platform-hr-overview"
      fields={[{ name: "name", label: "Name" }]}
      columns={["name", "organizationId", "isActive", "createdAt"]}
      note="This foundation view lists departments only. Payroll is intentionally out of scope."
    />
  );
}
