import Link from "next/link";

type MarketplaceHeroProps = {
  featuredCount: number;
};

const trustSignals = [
  "Verified developer profiles",
  "Organized public inventory",
  "CRM-backed follow-up",
];

export function MarketplaceHero({ featuredCount }: MarketplaceHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-accent-soft) 74%, transparent), transparent 34%), linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Public real estate marketplace
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl">
            Discover real estate projects with clearer trust and follow-up.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)] sm:text-lg sm:leading-8">
            Browse public projects from participating organizations, compare the
            facts that are available, and send interest to the right team without
            exposing private sales data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/projects" className="ui-button ui-button-primary">
              Browse projects
            </Link>
          </div>
        </div>

        <div className="ui-card grid gap-4 p-4 sm:p-5">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Marketplace focus
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
              Built for confident browsing
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              POPWAM presents published project details and routes interest
              through the existing contact workflow, keeping private inventory
              and deal records out of public view.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {trustSignals.map((signal) => (
              <div
                key={signal}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <span
                  className="mb-3 block h-2 w-8 rounded-[var(--radius-full)] bg-[var(--color-accent)]"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {signal}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            {featuredCount > 0
              ? `${featuredCount} featured project${featuredCount === 1 ? "" : "s"} available from the current public collection.`
              : "Featured projects will appear here when public listings are available."}
          </p>
        </div>
      </div>
    </section>
  );
}
