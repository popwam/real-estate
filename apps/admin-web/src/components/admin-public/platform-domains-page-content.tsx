"use client";

import { PlatformDomainReviewTable } from "@/components/admin-public/platform-domain-review-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useApprovePlatformDomain, usePlatformDomains, useRejectPlatformDomain } from "@/hooks/use-admin-public";

export function PlatformDomainsPageContent() {
  const { data = [], isLoading, error } = usePlatformDomains();
  const approve = useApprovePlatformDomain();
  const reject = useRejectPlatformDomain();
  const actionError = approve.error ?? reject.error;

  return (
    <>
      <PageHeader title="Domain review" description="Review organization domain verification records. No DNS provider or Cloudflare action is triggered." />
      <DetailCard title="Platform domain queue">
        {isLoading ? <LoadingState label="Loading domain records" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? (
          <PlatformDomainReviewTable
            actionError={actionError}
            domains={data}
            isWorking={approve.isPending || reject.isPending}
            onApprove={(id) => approve.mutateAsync(id)}
            onReject={(id, reason) => reject.mutateAsync({ id, input: { reason } })}
          />
        ) : null}
      </DetailCard>
    </>
  );
}
