"use client";

import { LeadClaimForm } from "@/components/lead-reservations/lead-claim-form";
import { LeadClaimTable } from "@/components/lead-reservations/lead-claim-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateLeadClaim, useMyLeadClaims, useReleaseLeadClaim } from "@/hooks/use-lead-reservations";

export default function BrokerageLeadClaimsPage() {
  const { data = [], isLoading, error } = useMyLeadClaims();
  const create = useCreateLeadClaim();
  const release = useReleaseLeadClaim();

  return (
    <>
      <PageHeader title="Lead Claims" description="Create and manage brokerage lead claims for marketplace clients." />
      <div className="space-y-6">
        <DetailCard title="Create Lead Claim">
          <LeadClaimForm isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title="My Lead Claims">
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
