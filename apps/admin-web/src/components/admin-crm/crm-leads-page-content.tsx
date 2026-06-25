"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { CrmLeadFilters } from "@/components/admin-crm/crm-lead-filters";
import { CrmPaginationControls } from "@/components/admin-crm/crm-pagination-controls";
import { CrmLeadsTable } from "@/components/admin-crm/crm-leads-table";
import { CrmSummaryCards } from "@/components/admin-crm/crm-summary-cards";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useClaimCrmLead, useCrmLeads, useMarketplaceCrmLeads } from "@/hooks/use-admin-crm";
import type { CrmLeadListQuery } from "@/types/admin-crm";

export function CrmLeadsPageContent({ basePath, marketplace = false }: { basePath: string; marketplace?: boolean }) {
  const [filters, setFilters] = useState<CrmLeadListQuery>({ page: 1, pageSize: 20 });
  const regularQuery = useCrmLeads(filters, !marketplace);
  const marketplaceQuery = useMarketplaceCrmLeads(filters, marketplace);
  const claim = useClaimCrmLead();
  const query = marketplace ? marketplaceQuery : regularQuery;
  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={marketplace ? "Marketplace leads" : "CRM lead inbox"} description={marketplace ? "Review available opportunities and claim only the leads your brokerage is ready to serve." : "Scan ownership, project interest, source, stage, and recency before choosing the next action."} />
      {marketplace ? <div className="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--color-info)] bg-[var(--color-info-soft)] p-4 text-sm leading-6 text-[var(--color-foreground)]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-info)]" aria-hidden="true" /><div><p className="font-semibold">Claim responsibly</p><p className="mt-1 text-[var(--color-muted)]">A confirmed claim assigns the lead through the existing eligibility rules. Contact details may remain masked until the backend authorizes access. No availability timer is assumed.</p></div></div> : <CrmSummaryCards />}
      <section className="ui-card p-4 sm:p-5" aria-labelledby="lead-filters-title"><h2 id="lead-filters-title" className="text-sm font-semibold text-[var(--color-foreground)]">Filter leads</h2><p className="mt-1 mb-4 text-xs leading-5 text-[var(--color-muted)]">Use existing CRM filters; result ownership and visibility remain backend-scoped.</p><CrmLeadFilters filters={filters} onChange={setFilters} /></section>
      <section className="ui-card p-4 sm:p-5" aria-labelledby="lead-results-title">
        <div className="mb-5"><h2 id="lead-results-title" className="text-lg font-semibold text-[var(--color-foreground)]">{marketplace ? "Available leads" : "Lead results"}</h2>{data ? <p className="mt-1 text-sm text-[var(--color-muted)]">{data.pagination.total.toLocaleString()} total results</p> : null}</div>
        {query.isLoading ? <LoadingState label="Loading CRM leads" /> : null}
        {query.error ? <FeedbackState tone="error" title="CRM leads could not be loaded" description={query.error.message} /> : null}
        {!query.isLoading && !query.error && data ? <><CrmLeadsTable basePath={basePath} isClaiming={claim.isPending} leads={data.items} showClaimAction={marketplace} onClaim={(id) => claim.mutateAsync(id)} /><CrmPaginationControls pagination={data.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} onPageSizeChange={(pageSize) => setFilters((current) => ({ ...current, page: 1, pageSize }))} /></> : null}
      </section>
    </div>
  );
}
