"use client";

import Link from "next/link";
import { Building2, CalendarDays, MessageSquareText, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CrmActivityTimeline } from "@/components/admin-crm/crm-activity-timeline";
import { ConversationMessagesTimeline } from "@/components/admin-crm/conversation-messages-timeline";
import { ConversationMessageComposer } from "@/components/admin-crm/conversation-message-composer";
import { ConversationShareLinkBox } from "@/components/admin-crm/conversation-share-link-box";
import { ConversationStatusUpdateDialog } from "@/components/admin-crm/conversation-status-update-dialog";
import { ConversationStatusBadge, PreferredContactMethodBadge } from "@/components/admin-crm/badges";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useConversation, useConversationActivities, useConversationMessages, useCreateConversationMessage } from "@/hooks/use-admin-crm";
import { formatDate } from "@/lib/format";
import type { CrmActivityListQuery } from "@/types/admin-crm";

export function ConversationDetailView({ id }: { id: string }) {
  const pathname = usePathname();
  const [activityQuery, setActivityQuery] = useState<CrmActivityListQuery>({ page: 1, pageSize: 20 });
  const conversation = useConversation(id);
  const activities = useConversationActivities(id, activityQuery);
  const messages = useConversationMessages(id);
  const createMessage = useCreateConversationMessage(id);

  if (conversation.isLoading) return <LoadingState label="Loading conversation workspace" />;
  if (conversation.error) return <FeedbackState tone="error" title="Conversation could not be loaded" description={conversation.error.message} />;
  if (!conversation.data) return <FeedbackState tone="error" title="Conversation is unavailable" />;

  const data = conversation.data;
  const title = data.crmLead?.client?.name ?? data.project?.name ?? formatLabel(data.type);
  const roleRoot = pathname.split("/").filter(Boolean)[0] ?? "developer";
  const leadHref = data.crmLeadId ? `/${roleRoot}/crm/leads/${data.crmLeadId}` : null;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Focused conversation workspace with lead context, participants, messages, and status controls." actions={<div className="flex flex-wrap gap-2"><ConversationStatusBadge status={data.status} /><PreferredContactMethodBadge method={data.crmLead?.preferredContactMethod} /></div>} />

      <section className="ui-card p-4 sm:p-5" aria-labelledby="conversation-overview-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">{formatLabel(data.type)}</p><h2 id="conversation-overview-title" className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">Conversation overview</h2></div>{leadHref ? <Link href={leadHref} className="ui-button ui-button-secondary">Open lead</Link> : null}</div><dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Fact icon={<Building2 className="h-4 w-4" aria-hidden="true" />} label="Project" value={data.project?.name ?? "Not linked"} /><Fact icon={<UserRound className="h-4 w-4" aria-hidden="true" />} label="Lead" value={data.crmLead?.client?.name ?? "Not linked"} /><Fact icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />} label="Created" value={formatDate(data.createdAt)} /><Fact icon={<MessageSquareText className="h-4 w-4" aria-hidden="true" />} label="Last updated" value={formatDate(data.updatedAt)} /></dl>{data.statusNote ? <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">Status note: {data.statusNote}</p> : null}</section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section className="ui-card overflow-hidden" aria-labelledby="messages-title"><div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-5"><h2 id="messages-title" className="text-sm font-semibold text-[var(--color-foreground)]">Messages</h2><p className="mt-1 text-xs text-[var(--color-muted)]">No unread state is inferred from this message list.</p></div><div className="max-h-[62vh] min-h-80 overflow-y-auto bg-[var(--color-surface-muted)] p-4 sm:p-5">{messages.isLoading ? <LoadingState label="Loading messages" /> : null}{messages.error ? <FeedbackState tone="error" title="Messages could not be loaded" description={messages.error.message} /> : null}{!messages.isLoading && !messages.error ? <ConversationMessagesTimeline messages={messages.data ?? []} /> : null}</div><div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"><ConversationMessageComposer error={createMessage.error} isPending={createMessage.isPending} onSubmit={(input) => createMessage.mutateAsync(input)} /></div></section>

          <DetailCard title="Conversation activity"><CrmActivityTimeline activities={activities.data?.items} error={activities.error} isLoading={activities.isLoading} pagination={activities.data?.pagination} onPageChange={(page) => setActivityQuery((current) => ({ ...current, page }))} onPageSizeChange={(pageSize) => setActivityQuery((current) => ({ ...current, page: 1, pageSize }))} /></DetailCard>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[calc(var(--topbar-height)+1.5rem)]" aria-label="Conversation context and actions">
          <DetailCard title="Status"><ConversationStatusUpdateDialog conversationId={data.id} currentStatus={data.status} /></DetailCard>
          <DetailCard title="Private share link"><ConversationShareLinkBox shareToken={data.shareToken} /></DetailCard>
          <DetailCard title="Participants"><div className="space-y-2">{(data.participants ?? []).length ? data.participants?.map((participant) => <div key={participant.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"><p className="text-sm font-semibold text-[var(--color-foreground)]">{participant.displayName || formatLabel(participant.publicRole)}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{formatLabel(participant.publicRole)}{participant.joinedAt ? ` · Joined ${formatDate(participant.joinedAt)}` : ""}</p></div>) : <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-muted)]">No participant details were returned.</p>}</div></DetailCard>
          <DetailCard title="Lead context"><div className="space-y-3"><ContextField label="Lead status" value={data.crmLead?.status ? formatLabel(data.crmLead.status) : "Not linked"} /><ContextField label="Preferred contact" value={formatLabel(data.crmLead?.preferredContactMethod ?? "NOT_SET")} /><ContextField label="Project" value={data.project?.name ?? "Not linked"} /><ContextField label="Organization" value={data.organization?.name ?? "Not returned"} /></div></DetailCard>
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"><dt className="flex items-center gap-2 text-xs text-[var(--color-muted)]">{icon}{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-[var(--color-foreground)]" title={value}>{value}</dd></div>; }
function ContextField({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p><p className="mt-1 text-sm text-[var(--color-foreground)]">{value}</p></div>; }
function formatLabel(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
