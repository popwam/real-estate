import type { ReactNode } from "react";

type PublicConversationShellProps = {
  title: string;
  description: string;
  context?: ReactNode;
  children: ReactNode;
  composer?: ReactNode;
};

export function PublicConversationShell({
  title,
  description,
  context,
  children,
  composer,
}: PublicConversationShellProps) {
  return (
    <section className="ui-card mx-auto flex h-[calc(100svh-8rem)] max-w-4xl flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          Private conversation
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
        {context ? <div className="mt-5">{context}</div> : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-background)] p-4 sm:p-6">
        {children}
      </div>
      {composer}
    </section>
  );
}
