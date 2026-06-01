"use client";

import { DealActionDialog } from "@/components/commercial/deal-action-dialog";
import { DealSummaryCard } from "@/components/commercial/deal-summary-card";
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
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!deal) return null;

  return (
    <>
      <PageHeader
        title={`Deal ${deal.id}`}
        description="Deal finalization record. Payments and ledger actions are intentionally absent."
        actions={
          <>
            <DealActionDialog action="approve" isPending={approve.isPending} error={approve.error} trigger={<Button>Approve</Button>} onConfirm={() => approve.mutateAsync(id)} />
            <DealActionDialog action="cancel" isPending={cancel.isPending} error={cancel.error} trigger={<Button className="bg-red-600 hover:bg-red-700">Cancel</Button>} onConfirm={(input) => cancel.mutateAsync({ id, input })} />
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DealSummaryCard deal={deal} />
        <DetailCard title="Commission Entries">
          <div className="space-y-2 text-sm text-zinc-700">
            {(deal.commissionEntries ?? []).length ? deal.commissionEntries?.map((entry) => (
              <div key={entry.id} className="rounded-md border border-zinc-200 p-3">
                <div className="font-medium">{entry.amount} {entry.currency}</div>
                <div className="text-zinc-500">{entry.partyType} - {entry.status}</div>
              </div>
            )) : <p>No commission entries returned for this deal.</p>}
          </div>
        </DetailCard>
      </div>
    </>
  );
}
