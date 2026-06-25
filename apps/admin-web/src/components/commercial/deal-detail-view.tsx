"use client";

import { DealActionDialog } from "@/components/commercial/deal-action-dialog";
import { DealSummaryCard } from "@/components/commercial/deal-summary-card";
import { DealStatusTimeline } from "@/components/commercial/deal-status-timeline";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useApproveDeal, useCancelDeal, useDeal } from "@/hooks/use-commercial";

export function DealDetailView({ id }: { id: string }) {
  const { data: deal, isLoading, error } = useDeal(id);
  const approve = useApproveDeal();
  const cancel = useCancelDeal();

  if (isLoading) return <LoadingState label="Loading deal" />;
  if (error) return <FeedbackState tone="error" title="Deal could not be loaded" description={error.message} />;
  if (!deal) return null;

  return (
    <>
      <PageHeader
        title={deal.project?.name ? `${deal.project.name} deal` : "Deal detail"}
        description={`${deal.unit?.unitNumber ? `Unit ${deal.unit.unitNumber} · ` : ""}Review the agreed value, parties, and supported lifecycle actions.`}
        actions={<>{deal.status === "PENDING_APPROVAL" ? <DealActionDialog action="approve" isPending={approve.isPending} error={approve.error} trigger={<Button>Approve</Button>} onConfirm={() => approve.mutateAsync(id)} /> : null}{deal.status !== "SOLD" && deal.status !== "CANCELLED" ? <DealActionDialog action="cancel" isPending={cancel.isPending} error={cancel.error} trigger={<Button className="bg-[var(--color-danger)] text-white hover:opacity-90">Cancel deal</Button>} onConfirm={(input) => cancel.mutateAsync({ id, input })} /> : null}</>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DealSummaryCard deal={deal} />
        <div className="space-y-6">
        <DetailCard title="Deal progress"><DealStatusTimeline deal={deal} /></DetailCard>
        <DetailCard title="Commission entries">
          <div className="space-y-2 text-sm text-[var(--color-text)]">
            {(deal.commissionEntries ?? []).length ? deal.commissionEntries?.map((entry) => (
              <div key={entry.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                <div className="font-medium">{entry.amount} {entry.currency}</div>
                <div className="text-[var(--color-text-muted)]">{entry.partyType.toLowerCase()} · {entry.status.toLowerCase()}</div>
              </div>
            )) : <p>No commission entries returned for this deal.</p>}
          </div>
        </DetailCard></div>
      </div>
    </>
  );
}
