import { notFound } from "next/navigation";
import { OrganizationProjectsSection } from "@/components/organization/organization-projects-section";
import { OrganizationProfileHero } from "@/components/organization/organization-profile-hero";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { OrganizationVerificationBadge } from "@/components/organization/organization-verification-badge";
import { OrganizationTrustStrip } from "@/components/organization/organization-trust-strip";
import { resolvePublicOrganizationByDomain } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type DomainAboutPageProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: DomainAboutPageProps) {
  const { domain } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);

  return createSeoMetadata({
    title: organization ? `About ${organization.name}` : "About organization",
    description:
      organization?.summary ?? "The requested organization about page was not found.",
    path: `/${domain}/about`,
    image: organization?.ogImageUrl,
    noindex: true,
  });
}

export default async function DomainAboutPage({ params }: DomainAboutPageProps) {
  const { domain } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationPublicShell domain={domain} organization={organization}>
      <OrganizationProfileHero
        organization={organization}
        eyebrow={`About ${organization.type === "DEVELOPER" ? "developer" : "brokerage"}`}
        primaryHref={`/${domain}/projects`}
        primaryLabel="View projects"
        secondaryHref={`/${domain}/contact`}
        secondaryLabel="Contact team"
      />
      <OrganizationTrustStrip
        organization={organization}
        projectCount={organization.projects.length}
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.36fr_0.64fr]">
        <aside className="ui-card p-5 sm:p-6">
          <OrganizationVerificationBadge label={organization.verifiedLabel} />
          <dl className="mt-6 grid gap-4 text-sm text-[var(--color-muted)]">
            <div>
              <dt className="font-semibold text-[var(--color-foreground)]">Location</dt>
              <dd>
                {organization.city}, {organization.country}
              </dd>
            </div>
            {organization.serviceAreas?.length ? (
              <div>
                <dt className="font-semibold text-[var(--color-foreground)]">
                  Service areas
                </dt>
                <dd>{organization.serviceAreas.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            About
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">
            {organization.name}
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--color-muted)]">
            {organization.summary}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {organization.highlights.map((highlight) => (
              <div key={highlight} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <p className="text-sm leading-6 text-[var(--color-muted)]">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <OrganizationProjectsSection
        domain={domain}
        projects={organization.projects}
        title="Projects from this organization"
        intro="Public projects appear when this organization has approved them for viewing."
      />
    </OrganizationPublicShell>
  );
}
