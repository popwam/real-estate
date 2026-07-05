"use client";

import { ConflictList } from "@/components/lead-reservations/conflict-list";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useLeadClaimConflicts } from "@/hooks/use-lead-reservations";
import { useI18n } from "@/i18n";

export default function DeveloperLeadClaimsPage() {
  const { t } = useI18n();

  const { data = [], isLoading, error } = useLeadClaimConflicts();

  return (
    <>
      <PageHeader
        title={t("adminSweep.lead.claims.512e748e")}
        description="Developer-visible claim conflict records. A general developer lead-claim list depends on a future backend endpoint."
      />
      <DetailCard title={t("adminSweep.claim.conflicts.on.developer.projects.4abc25ef")}>
        {isLoading ? <LoadingState label="Loading lead claim records" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? <ConflictList conflicts={data} /> : null}
      </DetailCard>
    </>
  );
}
