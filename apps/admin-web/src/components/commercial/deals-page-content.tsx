"use client";

import { useRouter } from "next/navigation";
import { DealActionDialog } from "@/components/commercial/deal-action-dialog";
import { DealTable } from "@/components/commercial/deal-table";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCreateDealFromRoom, useDeals } from "@/hooks/use-commercial";
import { CommercialSummaryStrip } from "@/components/commercial/commercial-summary-strip";
import { useI18n } from "@/i18n";

export function DealsPageContent({ basePath }: { basePath: string }) {
  const { t } = useI18n();

  const router = useRouter();
  const { data = [], isLoading, error } = useDeals();
  const create = useCreateDealFromRoom();

  return (
    <>
      <PageHeader
        title={t("adminSweep.deals.2c874671")}
        description="Review the commercial outcomes created from eligible negotiation rooms."
        actions={
          <DealActionDialog
            action="finalize"
            isPending={create.isPending}
            error={create.error}
            trigger={<Button>{t("adminSweep.finalize.eligible.room.be1c75b7")}</Button>}
            onConfirm={async (input) => {
              const deal = await create.mutateAsync({
                dealRoomId: input.dealRoomId ?? "",
                finalPrice: input.finalPrice,
                currency: input.currency,
              });
              router.push(`${basePath}/${deal.id}`);
            }}
          />
        }
      />
      {!isLoading && !error ? <CommercialSummaryStrip items={[{ label: "All deals", value: data.length, description: "Authorized deal records" }, { label: "Awaiting approval", value: data.filter((deal) => deal.status === "PENDING_APPROVAL").length, description: "Deals ready for review" }, { label: "Approved", value: data.filter((deal) => deal.status === "APPROVED").length, description: "Approved commercial outcomes" }, { label: "Sold", value: data.filter((deal) => deal.status === "SOLD").length, description: "Completed sale outcomes" }]} /> : null}
      <DetailCard title={t("adminSweep.deal.pipeline.f8510389")}>
        {isLoading ? <LoadingState label="Loading deals" /> : null}
        {error ? <FeedbackState tone="error" title={t("adminSweep.deals.could.not.be.loaded.5fb2c848")} description={error.message} /> : null}
        {!isLoading && !error ? <DealTable deals={data} basePath={basePath} /> : null}
      </DetailCard>
    </>
  );
}
