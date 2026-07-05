"use client";

import { OperationsSummaryPage } from "@/components/admin-operations/operations-summary-page";
import { useI18n } from "@/i18n";

export default function PlatformAccountingOverviewPage() {
  const { t } = useI18n();

  return (
    <OperationsSummaryPage
      title={t("adminSweep.accounting.overview.ec2261c9")}
      description="Platform scoped income and expense totals."
      path="/accounting/summary"
      queryKey="platform-accounting-overview"
    />
  );
}
