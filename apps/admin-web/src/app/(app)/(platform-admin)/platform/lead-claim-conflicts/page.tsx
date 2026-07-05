"use client";

import { ConflictList } from "@/components/lead-reservations/conflict-list";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useLeadClaimConflicts, useResolveLeadClaimConflict } from "@/hooks/use-lead-reservations";
import { useI18n } from "@/i18n";

export default function PlatformLeadClaimConflictsPage() {
  const { t } = useI18n();

  const { data = [], isLoading, error } = useLeadClaimConflicts();
  const resolve = useResolveLeadClaimConflict();

  return (
    <>
      <PageHeader
        title={t("adminSweep.lead.claim.conflicts.89e245d0")}
        description="Review duplicate lead claim conflicts and record platform resolution decisions."
      />
      <DetailCard title={t("adminSweep.conflicts.1e6b4f9a")}>
        {isLoading ? <LoadingState label="Loading claim conflicts" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? (
          <ConflictList
            conflicts={data}
            canResolve
            isResolving={resolve.isPending}
            error={resolve.error}
            onResolve={(id, input) => resolve.mutateAsync({ id, input })}
          />
        ) : null}
      </DetailCard>
    </>
  );
}
