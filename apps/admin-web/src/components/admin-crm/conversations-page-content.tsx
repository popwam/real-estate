"use client";

import { useState } from "react";
import { ConversationFilters } from "@/components/admin-crm/conversation-filters";
import { ConversationsTable } from "@/components/admin-crm/conversations-table";
import { CrmPaginationControls } from "@/components/admin-crm/crm-pagination-controls";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useConversations } from "@/hooks/use-admin-crm";
import type { ConversationListQuery } from "@/types/admin-crm";

export function ConversationsPageContent({ basePath }: { basePath: string }) {
  const [filters, setFilters] = useState<ConversationListQuery>({ page: 1, pageSize: 20 });
  const { data, isLoading, error } = useConversations(filters);

  return (
    <>
      <PageHeader title="Conversations" description="CRM lead conversations scoped by backend authorization." />
      <div className="space-y-6">
      <DetailCard title="Filters">
        <ConversationFilters filters={filters} onChange={setFilters} />
      </DetailCard>
      <DetailCard title="Conversation inbox">
        {isLoading ? <LoadingState label="Loading conversations" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error && data ? (
          <>
            <ConversationsTable basePath={basePath} conversations={data.items} />
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
