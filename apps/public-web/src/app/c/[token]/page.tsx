import { notFound } from "next/navigation";
import { PublicConversationView } from "@/components/conversation/public-conversation-view";
import { getPublicConversationByToken } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type ConversationPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: ConversationPageProps) {
  const { token } = await params;

  return createSeoMetadata({
    title: "Conversation",
    description: "Public-safe POPWAM conversation view.",
    path: `/c/${token}`,
    noindex: true,
  });
}

export default async function PublicConversationPage({
  params,
}: ConversationPageProps) {
  const { token } = await params;
  const conversation = await getConversationByTokenOrNull(token);

  if (!conversation) {
    notFound();
  }

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <PublicConversationView token={token} initialConversation={conversation} />
      </section>
    </main>
  );
}

async function getConversationByTokenOrNull(token: string) {
  try {
    return await getPublicConversationByToken(token);
  } catch {
    return null;
  }
}
