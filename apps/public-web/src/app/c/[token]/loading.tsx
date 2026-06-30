import { PublicConversationState } from "@/components/conversation/public-conversation-state";
import { tServer } from "@/i18n/server";

export default function PublicConversationLoading() {
  const t = (key: string) => tServer(undefined, key);

  return (
    <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6">
      <PublicConversationState
        title={t("conversation.loadingTitle")}
        body={t("conversation.loadingBody")}
        actionHref="/"
        actionLabel={t("nav.popwamHome")}
      />
    </div>
  );
}
