"use client";

import { DomainCreateForm } from "@/components/admin-public/domain-create-form";
import { OrganizationDomainsTable } from "@/components/admin-public/organization-domains-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import {
  useCreateOrganizationDomain,
  useCheckDomainDns,
  useMarkDomainVerifiedDevOnly,
  useOrganizationDomains,
  useRequestDomainVerification,
} from "@/hooks/use-admin-public";

export function OrganizationDomainsPageContent() {
  const { data = [], isLoading, error } = useOrganizationDomains();
  const create = useCreateOrganizationDomain();
  const requestVerification = useRequestDomainVerification();
  const checkDns = useCheckDomainDns();
  const devVerify = useMarkDomainVerifiedDevOnly();
  const showDevActions = process.env.NODE_ENV !== "production";
  const actionError = create.error ?? requestVerification.error ?? checkDns.error ?? devVerify.error;

  return (
    <>
      <PageHeader title="Domains" description="Manage public domain verification records. DNS checks and Cloudflare automation are not implemented in this slice." />
      <div className="space-y-5">
        <DetailCard title="Add domain">
          <DomainCreateForm error={create.error} isPending={create.isPending} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title="Domain records">
          {isLoading ? <LoadingState label="Loading domains" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {actionError ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError.message}</p> : null}
          {!isLoading && !error ? (
            <OrganizationDomainsTable
              domains={data}
              isWorking={requestVerification.isPending || checkDns.isPending || devVerify.isPending}
              showDevActions={showDevActions}
              onCheckDns={(id) => checkDns.mutate(id)}
              onMarkVerifiedDevOnly={(id) => devVerify.mutate(id)}
              onRequestVerification={(id) => requestVerification.mutate(id)}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
