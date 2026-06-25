import Link from "next/link";

type PublicConversationStateProps = {
  eyebrow?: string;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PublicConversationState({
  eyebrow = "Private conversation",
  title,
  body,
  actionHref = "/",
  actionLabel = "Back to POPWAM",
}: PublicConversationStateProps) {
  return (
    <section className="ui-card mx-auto max-w-2xl p-6 text-center sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
      <Link href={actionHref} className="ui-button ui-button-primary mt-6">
        {actionLabel}
      </Link>
    </section>
  );
}
