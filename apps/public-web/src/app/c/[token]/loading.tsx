import { PublicConversationState } from "@/components/conversation/public-conversation-state";

export default function PublicConversationLoading() {
  return (
    <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6">
      <PublicConversationState
        title="Loading private conversation"
        body="Please wait while we open the conversation linked to this request."
        actionHref="/"
        actionLabel="POPWAM home"
      />
    </div>
  );
}
