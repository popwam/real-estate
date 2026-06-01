"use client";

import { useState } from "react";
import { CrmLeadFilters } from "@/components/admin-crm/crm-lead-filters";
import { CrmPaginationControls } from "@/components/admin-crm/crm-pagination-controls";
import { CrmLeadsTable } from "@/components/admin-crm/crm-leads-table";
import { CrmSummaryCards } from "@/components/admin-crm/crm-summary-cards";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useClaimCrmLead, useCrmLeads, useMarketplaceCrmLeads } from "@/hooks/use-admin-crm";
import type { CrmLeadListQuery } from "@/types/admin-crm";

export function CrmLeadsPageContent({
  basePath,
  marketplace = false,
}: {
  basePath: string;
  marketplace?: boolean;
}) {
  const [filters, setFilters] = useState<CrmLeadListQuery>({ page: 1, pageSize: 20 });
  const regularQuery = useCrmLeads(filters, !marketplace);
  const marketplaceQuery = useMarketplaceCrmLeads(filters, marketplace);
  const claim = useClaimCrmLead();
  const query = marketplace ? marketplaceQuery : regularQuery;
  const data = query.data;

  return (
    <>
      <PageHeader
        title={marketplace ? "Marketplace CRM leads" : "CRM leads"}
        description={
          marketplace
            ? "Claimable marketplace leads. Claimed leads may be returned masked by the backend."
            : "Scoped CRM leads from public lead conversion and conversation workflows."
        }
      />
      <div className="space-y-6">
        <CrmSummaryCards />
        <DetailCard title="Filters">
          <CrmLeadFilters filters={filters} onChange={setFilters} />
        </DetailCard>
      <DetailCard
        title={marketplace ? "Available leads" : "Lead inbox"}
      >
        {query.isLoading ? <LoadingState label="Loading CRM leads" /> : null}
        {query.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{query.error.message}</p> : null}
        {!query.isLoading && !query.error && data ? (
          <>
            <CrmLeadsTable
              basePath={basePath}
              claimError={claim.error}
              isClaiming={claim.isPending}
              leads={data.items}
              showClaimAction={marketplace}
              onClaim={(id) => claim.mutateAsync(id)}
            />
            <CrmPaginationControls
              pagination={data.pagination}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              onPageSizeChange={(pageSize) => setFilters((current) => ({ ...current, page: 1, pageSize }))}
            />
          </>
        ) : null}
      </DetailCard>
      </div>
    </>
  );
}
