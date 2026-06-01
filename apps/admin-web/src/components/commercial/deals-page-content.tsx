"use client";

import { useRouter } from "next/navigation";
import { DealActionDialog } from "@/components/commercial/deal-action-dialog";
import { DealTable } from "@/components/commercial/deal-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCreateDealFromRoom, useDeals } from "@/hooks/use-commercial";

export function DealsPageContent({ basePath }: { basePath: string }) {
  const router = useRouter();
  const { data = [], isLoading, error } = useDeals();
  const create = useCreateDealFromRoom();

  return (
    <>
      <PageHeader
        title="Deals"
        description="Deal finalization records scoped by backend authorization. No payment or ledger actions are available."
        actions={
          <DealActionDialog
            action="finalize"
            isPending={create.isPending}
            error={create.error}
            trigger={<Button>Finalize from deal room</Button>}
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
      <DetailCard title="Deals">
        {isLoading ? <LoadingState label="Loading deals" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? <DealTable deals={data} basePath={basePath} /> : null}
      </DetailCard>
    </>
  );
}
