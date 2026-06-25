export default function ProjectsLoading() {
  return (
    <div className="bg-[var(--color-background)]">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="h-4 w-40 rounded-[var(--radius-full)] bg-[var(--color-surface-muted)]" />
          <div className="mt-4 h-10 max-w-xl rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
          <div className="mt-4 h-5 max-w-2xl rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.38fr_0.62fr]">
        <div className="ui-card h-80 animate-pulse" aria-label="Loading project filters" />
        <div className="grid gap-6">
          <div className="ui-card h-80 animate-pulse" aria-label="Loading project result" />
          <div className="ui-card h-80 animate-pulse" aria-label="Loading project result" />
        </div>
      </section>
    </div>
  );
}
