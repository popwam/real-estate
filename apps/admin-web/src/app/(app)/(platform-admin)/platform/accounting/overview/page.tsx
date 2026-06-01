"use client";

import { OperationsSummaryPage } from "@/components/admin-operations/operations-summary-page";

export default function PlatformAccountingOverviewPage() {
  return (
    <OperationsSummaryPage
      title="Accounting overview"
      description="Platform scoped income and expense totals."
      path="/accounting/summary"
      queryKey="platform-accounting-overview"
    />
  );
}
