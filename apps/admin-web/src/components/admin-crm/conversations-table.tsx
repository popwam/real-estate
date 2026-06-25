"use client";

import { ConversationResponsiveList } from "@/components/conversations/conversation-responsive-list";
import type { Conversation } from "@/types/admin-crm";

export function ConversationsTable({ conversations, basePath }: { conversations: Conversation[]; basePath: string }) {
  return <ConversationResponsiveList conversations={conversations} basePath={basePath} />;
}
