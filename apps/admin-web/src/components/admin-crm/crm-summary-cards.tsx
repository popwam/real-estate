"use client";

import { LoadingState } from "@/components/loading-state";
import { DetailCard } from "@/components/platform/detail-card";
import { useCrmSummary } from "@/hooks/use-admin-crm";

export function CrmSummaryCards() {
  const { data, isLoading, error } = useCrmSummary();

  if (isLoading) return <LoadingState label="Loading CRM summary" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!data) return null;

  const cards = [
    { label: "Total leads", value: data.leads.total },
    { label: "New leads", value: data.leads.new },
    { label: "Claimed", value: data.leads.claimed },
    { label: "Qualified", value: data.leads.qualified },
    { label: "Converted", value: data.leads.converted },
    { label: "Spam", value: data.leads.spam },
    { label: "Open conversations", value: data.conversations.open },
    { label: "Today's new", value: data.today.newLeads },
    { label: "Today's messages", value: data.today.newMessages },
  ];

  return (
    <DetailCard title="CRM summary">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{card.value}</p>
          </div>
        ))}
      </div>
    </DetailCard>
  );
}
