"use client";

import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { useCrmSummary } from "@/hooks/use-admin-crm";

export function CrmSummaryCards() {
  const { data, isLoading, error } = useCrmSummary();

  if (isLoading) return <LoadingState label="Loading CRM summary" />;
  if (error) return <FeedbackState tone="error" title="CRM summary could not be loaded" description={error.message} />;
  if (!data) return null;

  const cards = [
    { label: "Total leads", value: data.leads.total },
    { label: "New", value: data.leads.new },
    { label: "Claimed", value: data.leads.claimed },
    { label: "Qualified", value: data.leads.qualified },
    { label: "Converted", value: data.leads.converted },
    { label: "Open conversations", value: data.conversations.open },
    { label: "New today", value: data.today.newLeads },
    { label: "Messages today", value: data.today.newMessages },
  ];

  return <section aria-labelledby="crm-summary-title"><h2 id="crm-summary-title" className="sr-only">CRM summary</h2><div className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">{cards.map((card) => <div key={card.label} className="ui-card p-4"><p className="text-xs font-semibold text-[var(--color-muted)]">{card.label}</p><p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{card.value.toLocaleString()}</p></div>)}</div></section>;
}
