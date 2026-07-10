"use client";

import { DomainCreateForm } from "@/components/admin-public/domain-create-form";
import { OrganizationDomainsTable } from "@/components/admin-public/organization-domains-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useI18n } from "@/i18n";
import {
  useCreateOrganizationDomain,
  useCheckDomainDns,
  useDeleteOrganizationDomain,
  useMarkDomainVerifiedDevOnly,
  useOrganizationDomains,
  useRequestDomainVerification,
  useSetDefaultDomain,
  useTestDomain,
} from "@/hooks/use-admin-public";

export function OrganizationDomainsPageContent() {
  const { t } = useI18n();

  const { data = [], isLoading, error } = useOrganizationDomains();
  const create = useCreateOrganizationDomain();
  const requestVerification = useRequestDomainVerification();
  const checkDns = useCheckDomainDns();
  const testDomain = useTestDomain();
  const setDefault = useSetDefaultDomain();
  const deleteDomain = useDeleteOrganizationDomain();
  const devVerify = useMarkDomainVerifiedDevOnly();
  const showDevActions = process.env.NODE_ENV !== "production";
  const actionError = create.error ?? requestVerification.error ?? checkDns.error ?? testDomain.error ?? setDefault.error ?? deleteDomain.error ?? devVerify.error;

  return (
    <>
      <PageHeader title={t("adminSweep.domains.a0d641b3")} description={t("companyDomains.description")} />
      <div className="space-y-5">
        <DetailCard title={t("adminSweep.add.domain.76d74001")}>
          <DomainCreateForm error={create.error} isPending={create.isPending} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title={t("adminSweep.domain.records.bdcc4d3d")}>
          {isLoading ? <LoadingState label={t("companyDomains.loading")} /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {actionError ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError.message}</p> : null}
          {!isLoading && !error ? (
            <OrganizationDomainsTable
              domains={data}
              isWorking={requestVerification.isPending || checkDns.isPending || testDomain.isPending || setDefault.isPending || deleteDomain.isPending || devVerify.isPending}
              showDevActions={showDevActions}
              onCheckDns={(id) => checkDns.mutate(id)}
              onTestDomain={(id) => testDomain.mutate(id)}
              onSetDefault={(id) => setDefault.mutate(id)}
              onDelete={(id) => deleteDomain.mutate(id)}
              onMarkVerifiedDevOnly={(id) => devVerify.mutate(id)}
              onRequestVerification={(id) => requestVerification.mutate(id)}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
