"use client";

import { useState } from "react";
import { ConversationFilters } from "@/components/admin-crm/conversation-filters";
import { ConversationsTable } from "@/components/admin-crm/conversations-table";
import { CrmPaginationControls } from "@/components/admin-crm/crm-pagination-controls";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useConversations } from "@/hooks/use-admin-crm";
import type { ConversationListQuery } from "@/types/admin-crm";
import { useI18n } from "@/i18n";

export function ConversationsPageContent({ basePath }: { basePath: string }) {
  const { t } = useI18n();

  const [filters, setFilters] = useState<ConversationListQuery>({ page: 1, pageSize: 20 });
  const { data, isLoading, error } = useConversations(filters);
  return <div className="space-y-6"><PageHeader title={t("adminSweep.conversation.inbox.7e45354e")} description="Continue lead and support discussions with clear participant, project, status, and recent-message context." /><section className="ui-card p-4 sm:p-5" aria-labelledby="conversation-filters-title"><h2 id="conversation-filters-title" className="text-sm font-semibold text-[var(--color-foreground)]">{t("adminSweep.filter.conversations.a70369ae")}</h2><p className="mt-1 mb-4 text-xs text-[var(--color-muted)]">{t("adminSweep.unread.state.is.not.assumed.because.the.current..8d5e41a6")}</p><ConversationFilters filters={filters} onChange={setFilters} /></section><section className="ui-card p-4 sm:p-5" aria-labelledby="conversation-results-title"><div className="mb-5"><h2 id="conversation-results-title" className="text-lg font-semibold text-[var(--color-foreground)]">{t("adminSweep.inbox.44caf746")}</h2>{data ? <p className="mt-1 text-sm text-[var(--color-muted)]">{data.pagination.total.toLocaleString()} conversations</p> : null}</div>{isLoading ? <LoadingState label="Loading conversations" /> : null}{error ? <FeedbackState tone="error" title={t("adminSweep.conversations.could.not.be.loaded.d0aa3c97")} description={error.message} /> : null}{!isLoading && !error && data ? <><ConversationsTable basePath={basePath} conversations={data.items} /><CrmPaginationControls pagination={data.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} onPageSizeChange={(pageSize) => setFilters((current) => ({ ...current, page: 1, pageSize }))} /></> : null}</section></div>;
}
