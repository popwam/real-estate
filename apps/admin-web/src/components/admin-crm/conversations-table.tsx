"use client";

import Link from "next/link";
import { ConversationStatusBadge, PreferredContactMethodBadge } from "@/components/admin-crm/badges";
import { DataTable } from "@/components/tables/data-table";
import { formatDate } from "@/lib/format";
import type { Conversation } from "@/types/admin-crm";

export function ConversationsTable({ conversations, basePath }: { conversations: Conversation[]; basePath: string }) {
  return (
    <DataTable<Conversation>
      columns={[
        { key: "type", header: "Type", cell: (row) => row.type.replaceAll("_", " ") },
        { key: "status", header: "Status", cell: (row) => <ConversationStatusBadge status={row.status} /> },
        { key: "lead", header: "Lead", cell: (row) => row.crmLead?.client?.name ?? row.crmLeadId ?? "Not linked" },
        { key: "contact", header: "Contact", cell: (row) => <PreferredContactMethodBadge method={row.crmLead?.preferredContactMethod} /> },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId ?? "Not set" },
        { key: "participants", header: "Participants", cell: (row) => participantSummary(row) },
        { key: "shareToken", header: "Share", cell: (row) => row.shareToken ? "Available" : "None" },
        { key: "updatedAt", header: "Updated", cell: (row) => formatDate(row.updatedAt) },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${basePath}/${row.id}`}>
              Open
            </Link>
          ),
        },
      ]}
      data={conversations}
      emptyTitle="No conversations yet"
      emptyDescription="CRM lead conversations will appear here when they are created."
    />
  );
}

function participantSummary(conversation: Conversation) {
  const participants = conversation.participants ?? [];
  if (!participants.length) return "Not set";
  return participants
    .slice(0, 3)
    .map((participant) => participant.displayName || participant.publicRole)
    .join(", ");
}
