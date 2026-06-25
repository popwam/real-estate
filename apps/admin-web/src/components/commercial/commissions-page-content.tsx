"use client";

import { CommissionTable } from "@/components/commercial/commission-table";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCommissions } from "@/hooks/use-commercial";
import { CommercialSummaryStrip } from "@/components/commercial/commercial-summary-strip";

export function CommissionsPageContent({ basePath }: { basePath: string }) {
  const { data = [], isLoading, error } = useCommissions();

  return (
    <>
      <PageHeader title="Commissions" description="Understand each calculated commission, its beneficiary, related deal, and review state." />
      {!isLoading && !error ? <CommercialSummaryStrip items={[{ label: "All entries", value: data.length, description: "Calculated commission records" }, { label: "Awaiting review", value: data.filter((entry) => entry.status === "PENDING").length, description: "Entries ready for a decision" }, { label: "Approved", value: data.filter((entry) => entry.status === "APPROVED").length, description: "Accepted calculations" }, { label: "Closed", value: data.filter((entry) => entry.status === "REJECTED" || entry.status === "CANCELLED" || entry.status === "PAID").length, description: "Rejected, cancelled, or recorded paid" }]} /> : null}
      <DetailCard title="Commission ledger">
        {isLoading ? <LoadingState label="Loading commissions" /> : null}
        {error ? <FeedbackState tone="error" title="Commissions could not be loaded" description={error.message} /> : null}
        {!isLoading && !error ? <CommissionTable commissions={data} basePath={basePath} /> : null}
      </DetailCard>
    </>
  );
}
