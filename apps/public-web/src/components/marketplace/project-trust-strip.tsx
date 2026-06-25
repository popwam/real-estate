const trustItems = [
  {
    title: "Verified developers",
    body: "Public profiles help visitors understand who is presenting each project.",
  },
  {
    title: "Organized inventory",
    body: "Only public-safe project and unit summaries are shown on marketplace pages.",
  },
  {
    title: "CRM-backed follow-up",
    body: "Interest forms use the existing POPWAM lead workflow for responsible follow-up.",
  },
  {
    title: "Governed marketplace",
    body: "Broker and developer visibility remains controlled by the platform rules already in place.",
  },
];

export function ProjectTrustStrip() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item) => (
          <article key={item.title} className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-5">
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
