import { cookies } from "next/headers";
import { PublicConversationState } from "@/components/conversation/public-conversation-state";
import { PublicConversationView } from "@/components/conversation/public-conversation-view";
import { normalizeLocale, tServer } from "@/i18n/server";
import { getPublicConversationByToken } from "@/lib/public-data";
import { PublicApiError } from "@/lib/public-api";
import { createSeoMetadata } from "@/lib/seo";

type ConversationPageProps = {
  params: Promise<{ token: string }>;
};

type ConversationResult =
  | Awaited<ReturnType<typeof getPublicConversationByToken>>
  | { error: ConversationError };

type ConversationError = "invalid" | "expired" | "inaccessible" | "network";

export async function generateMetadata({ params }: ConversationPageProps) {
  const { token } = await params;

  return createSeoMetadata({
    title: "Private Conversation",
    description: "Private POPWAM conversation link.",
    path: `/c/${token}`,
    noindex: true,
  });
}

export default async function PublicConversationPage({
  params,
}: ConversationPageProps) {
  const { token } = await params;
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const result = await getConversationResult(token);

  return (
    <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6">
      {"error" in result ? (
        <ConversationErrorState error={result.error} locale={locale} />
      ) : (
        <PublicConversationView token={token} initialConversation={result} />
      )}
    </div>
  );
}

async function getConversationResult(token: string): Promise<ConversationResult> {
  try {
    return await getPublicConversationByToken(token);
  } catch (error) {
    if (error instanceof PublicApiError) {
      if (error.status === 404) return { error: "invalid" };
      if (error.status === 410) return { error: "expired" };
      if (error.status === 401 || error.status === 403) {
        return { error: "inaccessible" };
      }
    }

    return { error: "network" };
  }
}

function ConversationErrorState({
  error,
  locale,
}: {
  error: ConversationError;
  locale: string;
}) {
  const t = (key: string) => tServer(locale, key);

  if (error === "expired") {
    return (
      <PublicConversationState
        title={t("conversation.error.expired")}
        body={t("conversation.error.expiredBody")}
      />
    );
  }

  if (error === "inaccessible") {
    return (
      <PublicConversationState
        title={t("conversation.error.inaccessibleTitle")}
        body={t("conversation.error.inaccessibleBody")}
      />
    );
  }

  if (error === "network") {
    return (
      <PublicConversationState
        title={t("conversation.errorLoadTitle")}
        body={t("conversation.error.networkBody")}
      />
    );
  }

  return (
    <PublicConversationState
      title={t("conversation.error.invalidTitle")}
      body={t("conversation.error.invalidBody")}
    />
  );
}
