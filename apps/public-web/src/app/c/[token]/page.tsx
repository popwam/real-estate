import { PublicConversationState } from "@/components/conversation/public-conversation-state";
import { PublicConversationView } from "@/components/conversation/public-conversation-view";
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
  const result = await getConversationResult(token);

  return (
    <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6">
      {"error" in result ? (
        <ConversationErrorState error={result.error} />
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
}: {
  error: ConversationError;
}) {
  if (error === "expired") {
    return (
      <PublicConversationState
        title="This conversation link has expired."
        body="The private link can no longer be opened. Please send a new interest request or contact the organization again."
      />
    );
  }

  if (error === "inaccessible") {
    return (
      <PublicConversationState
        title="This conversation cannot be opened."
        body="This private link is not accessible from here. Please use the latest link shared with you."
      />
    );
  }

  if (error === "network") {
    return (
      <PublicConversationState
        title="We could not load this conversation."
        body="Please refresh the page. If the issue continues, the conversation service may be temporarily unavailable."
      />
    );
  }

  return (
    <PublicConversationState
      title="This conversation link is not valid."
      body="Please check that you opened the full private link. You can also send a new interest request from a project page."
    />
  );
}
