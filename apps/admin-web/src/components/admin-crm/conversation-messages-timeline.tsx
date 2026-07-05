"use client";

import { MessageSquareText } from "lucide-react";
import { MessageBubble } from "@/components/conversations/message-bubble";
import { EmptyState } from "@/components/empty-state";
import type { ConversationMessage } from "@/types/admin-crm";
import { useI18n } from "@/i18n";

export function ConversationMessagesTimeline({ messages = [] }: { messages?: ConversationMessage[] }) {
  const { t } = useI18n();

  if (!messages.length) return <EmptyState icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />} title={t("adminSweep.no.messages.yet.c04921f8")} description="Use the composer below to start this conversation." />;
  return <ol className="space-y-3" aria-label={t("adminSweep.conversation.messages.a4abc945")}>{messages.map((message) => <MessageBubble key={message.id} message={message} />)}</ol>;
}
