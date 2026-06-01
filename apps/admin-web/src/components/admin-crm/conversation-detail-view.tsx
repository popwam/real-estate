"use client";

import { useState } from "react";
import { CrmActivityTimeline } from "@/components/admin-crm/crm-activity-timeline";
import { ConversationMessagesTimeline } from "@/components/admin-crm/conversation-messages-timeline";
import { ConversationMessageComposer } from "@/components/admin-crm/conversation-message-composer";
import { ConversationShareLinkBox } from "@/components/admin-crm/conversation-share-link-box";
import { ConversationStatusUpdateDialog } from "@/components/admin-crm/conversation-status-update-dialog";
import { ConversationStatusBadge, PreferredContactMethodBadge } from "@/components/admin-crm/badges";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import {
  useConversation,
  useConversationActivities,
  useConversationMessages,
  useCreateConversationMessage,
} from "@/hooks/use-admin-crm";
import { formatDate } from "@/lib/format";
import type { CrmActivityListQuery } from "@/types/admin-crm";

export function ConversationDetailView({ id }: { id: string }) {
  const [activityQuery, setActivityQuery] = useState<CrmActivityListQuery>({ page: 1, pageSize: 20 });
  const { data: conversation, isLoading, error } = useConversation(id);
  const activities = useConversationActivities(id, activityQuery);
  const messages = useConversationMessages(id);
  const createMessage = useCreateConversationMessage(id);

  if (isLoading) return <LoadingState label="Loading conversation" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!conversation) return null;

  return (
    <>
      <PageHeader
        title={`Conversation ${conversation.id}`}
        description="Authenticated CRM conversation detail with message composer. No WebSocket, attachments, or external chat provider."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <DetailCard title="Conversation summary">
            <DetailGrid
              items={[
                { label: "Status", value: <ConversationStatusBadge status={conversation.status} /> },
                { label: "Status note", value: conversation.statusNote ?? "Not set" },
                { label: "Type", value: conversation.type.replaceAll("_", " ") },
                { label: "Lead", value: conversation.crmLead?.client?.name ?? conversation.crmLeadId ?? "Not linked" },
                { label: "Preferred contact", value: <PreferredContactMethodBadge method={conversation.crmLead?.preferredContactMethod} /> },
                { label: "Project", value: conversation.project?.name ?? conversation.projectId ?? "Not set" },
                { label: "Organization", value: conversation.organization?.name ?? conversation.organizationId ?? "Not set" },
                { label: "Created", value: formatDate(conversation.createdAt) },
                { label: "Updated", value: formatDate(conversation.updatedAt) },
              ]}
            />
          </DetailCard>
          <DetailCard title="Messages">
            {messages.isLoading ? <LoadingState label="Loading messages" /> : null}
            {messages.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{messages.error.message}</p> : null}
            {!messages.isLoading && !messages.error ? <ConversationMessagesTimeline messages={messages.data ?? []} /> : null}
          </DetailCard>
          <DetailCard title="Activity timeline">
            <CrmActivityTimeline
              activities={activities.data?.items}
              error={activities.error}
              isLoading={activities.isLoading}
              pagination={activities.data?.pagination}
              onPageChange={(page) => setActivityQuery((current) => ({ ...current, page }))}
              onPageSizeChange={(pageSize) => setActivityQuery((current) => ({ ...current, page: 1, pageSize }))}
            />
          </DetailCard>
        </div>
        <div className="space-y-6">
          <DetailCard title="Update status">
            <ConversationStatusUpdateDialog conversationId={conversation.id} currentStatus={conversation.status} />
          </DetailCard>
          <DetailCard title="Public share link">
            <ConversationShareLinkBox shareToken={conversation.shareToken} />
          </DetailCard>
          <DetailCard title="Participants">
            <div className="space-y-3">
              {(conversation.participants ?? []).length ? (
                conversation.participants?.map((participant) => (
                  <div key={participant.id} className="rounded-md border border-zinc-200 p-3">
                    <p className="text-sm font-medium text-zinc-950">{participant.displayName || participant.publicRole}</p>
                    <p className="text-xs text-zinc-500">{participant.publicRole}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No participants returned.</p>
              )}
            </div>
          </DetailCard>
          <DetailCard title="Send message">
            <ConversationMessageComposer
              error={createMessage.error}
              isPending={createMessage.isPending}
              onSubmit={(input) => createMessage.mutateAsync(input)}
            />
          </DetailCard>
        </div>
      </div>
    </>
  );
}
