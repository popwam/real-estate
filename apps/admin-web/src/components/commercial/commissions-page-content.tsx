"use client";

import { CommissionTable } from "@/components/commercial/commission-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCommissions } from "@/hooks/use-commercial";

export function CommissionsPageContent({ basePath }: { basePath: string }) {
  const { data = [], isLoading, error } = useCommissions();

  return (
    <>
      <PageHeader title="Commissions" description="Commission entries scoped by the backend. No paid or settlement workflow is exposed." />
      <DetailCard title="Commissions">
        {isLoading ? <LoadingState label="Loading commissions" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? <CommissionTable commissions={data} basePath={basePath} /> : null}
      </DetailCard>
    </>
  );
}
