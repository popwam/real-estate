"use client";

import { OperationsSummaryPage } from "@/components/admin-operations/operations-summary-page";
import { useI18n } from "@/i18n";

export default function DeveloperAccountingSummaryPage() {
  const { t } = useI18n();

  return (
    <OperationsSummaryPage
      title={t("adminSweep.accounting.summary.5d48c439")}
      description="Scoped income and expense totals for foundation accounting."
      path="/accounting/summary"
      queryKey="accounting-summary"
    />
  );
}
