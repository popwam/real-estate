"use client";

import { CommissionTable } from "@/components/commercial/commission-table";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCommissions } from "@/hooks/use-commercial";
import { CommercialSummaryStrip } from "@/components/commercial/commercial-summary-strip";
import { useI18n } from "@/i18n";

export function CommissionsPageContent({ basePath }: { basePath: string }) {
  const { t } = useI18n();

  const { data = [], isLoading, error } = useCommissions();

  return (
    <>
      <PageHeader title={t("adminSweep.commissions.c51e0bc1")} description="Understand each calculated commission, its beneficiary, related deal, and review state." />
      {!isLoading && !error ? <CommercialSummaryStrip items={[{ label: "All entries", value: data.length, description: "Calculated commission records" }, { label: "Awaiting review", value: data.filter((entry) => entry.status === "PENDING").length, description: "Entries ready for a decision" }, { label: "Approved", value: data.filter((entry) => entry.status === "APPROVED").length, description: "Accepted calculations" }, { label: "Closed", value: data.filter((entry) => entry.status === "REJECTED" || entry.status === "CANCELLED" || entry.status === "PAID").length, description: "Rejected, cancelled, or recorded paid" }]} /> : null}
      <DetailCard title={t("adminSweep.commission.ledger.edf36067")}>
        {isLoading ? <LoadingState label="Loading commissions" /> : null}
        {error ? <FeedbackState tone="error" title={t("adminSweep.commissions.could.not.be.loaded.4818429f")} description={error.message} /> : null}
        {!isLoading && !error ? <CommissionTable commissions={data} basePath={basePath} /> : null}
      </DetailCard>
    </>
  );
}
