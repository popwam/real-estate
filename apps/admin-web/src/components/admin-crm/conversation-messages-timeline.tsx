import { MessageSquareText } from "lucide-react";
import { MessageBubble } from "@/components/conversations/message-bubble";
import { EmptyState } from "@/components/empty-state";
import type { ConversationMessage } from "@/types/admin-crm";

export function ConversationMessagesTimeline({ messages = [] }: { messages?: ConversationMessage[] }) {
  if (!messages.length) return <EmptyState icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />} title="No messages yet" description="Use the composer below to start this conversation." />;
  return <ol className="space-y-3" aria-label="Conversation messages">{messages.map((message) => <MessageBubble key={message.id} message={message} />)}</ol>;
}
