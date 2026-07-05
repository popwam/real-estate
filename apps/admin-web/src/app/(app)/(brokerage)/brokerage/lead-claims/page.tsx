"use client";

import { LeadClaimForm } from "@/components/lead-reservations/lead-claim-form";
import { LeadClaimTable } from "@/components/lead-reservations/lead-claim-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateLeadClaim, useMyLeadClaims, useReleaseLeadClaim } from "@/hooks/use-lead-reservations";
import { useI18n } from "@/i18n";

export default function BrokerageLeadClaimsPage() {
  const { t } = useI18n();

  const { data = [], isLoading, error } = useMyLeadClaims();
  const create = useCreateLeadClaim();
  const release = useReleaseLeadClaim();

  return (
    <>
      <PageHeader title={t("adminSweep.lead.claims.512e748e")} description="Create and manage brokerage lead claims for marketplace clients." />
      <div className="space-y-6">
        <DetailCard title={t("adminSweep.create.lead.claim.0895fe75")}>
          <LeadClaimForm isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title={t("adminSweep.my.lead.claims.a4084e06")}>
          {isLoading ? <LoadingState label="Loading lead claims" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <LeadClaimTable
              claims={data}
              basePath="/brokerage/lead-claims"
              isReleasing={release.isPending}
              onRelease={(id) => release.mutate(id)}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
