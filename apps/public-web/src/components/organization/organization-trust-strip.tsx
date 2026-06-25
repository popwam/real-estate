import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationTrustStripProps = {
  organization: PublicOrganization;
  projectCount?: number;
};

export function OrganizationTrustStrip({
  organization,
  projectCount,
}: OrganizationTrustStripProps) {
  const items = [
    {
      title: "Public profile",
      body:
        organization.type === "DEVELOPER"
          ? "Developer information is presented from the public organization profile."
          : "Brokerage information is presented from the public organization profile.",
    },
    {
      title: "Market context",
      body: [organization.city, organization.country].filter(Boolean).join(", "),
    },
    {
      title: "Project visibility",
      body:
        typeof projectCount === "number"
          ? `${projectCount} public project${projectCount === 1 ? "" : "s"} available`
          : "Public portfolio appears when projects are available.",
    },
  ];

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5"
          >
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {item.body || "Available on request."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
