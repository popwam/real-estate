"use client";

import Link from "next/link";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return (
    <div className="bg-[var(--color-background)] px-4 py-16 sm:px-6">
      <section className="ui-card mx-auto max-w-2xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          Projects unavailable
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          We could not load projects right now.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          Please try again. If the issue continues, the marketplace may be
          temporarily unavailable.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="ui-button ui-button-primary">
            Try again
          </button>
          <Link href="/" className="ui-button ui-button-secondary">
            Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}
