"use client";

import { OperationsSummaryPage } from "@/components/admin-operations/operations-summary-page";

export default function DeveloperAccountingSummaryPage() {
  return (
    <OperationsSummaryPage
      title="Accounting summary"
      description="Scoped income and expense totals for foundation accounting."
      path="/accounting/summary"
      queryKey="accounting-summary"
    />
  );
}
