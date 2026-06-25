import { notFound } from "next/navigation";
import { OrganizationProjectsSection } from "@/components/organization/organization-projects-section";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { OrganizationTrustStrip } from "@/components/organization/organization-trust-strip";
import { resolvePublicOrganizationByDomain } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type DomainProjectsPageProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: DomainProjectsPageProps) {
  const { domain } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);

  return createSeoMetadata({
    title: organization ? `${organization.name} Projects` : "Organization projects",
    description:
      organization?.summary ??
      "Public organization project listing could not be resolved.",
    path: `/${domain}/projects`,
    image: organization?.ogImageUrl,
    noindex: true,
  });
}

export default async function DomainProjectsPage({ params }: DomainProjectsPageProps) {
  const { domain } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationPublicShell domain={domain} organization={organization}>
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Organization projects
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">
            {organization.name} projects
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            Browse this organization&apos;s public portfolio. The current
            collection has {organization.projects.length} project
            {organization.projects.length === 1 ? "" : "s"} available.
          </p>
        </div>
      </section>
      <OrganizationTrustStrip
        organization={organization}
        projectCount={organization.projects.length}
      />
      <OrganizationProjectsSection
        domain={domain}
        projects={organization.projects}
        title="Project portfolio"
        intro="Project cards show public facts from this organization profile only."
        showViewAll={false}
      />
    </OrganizationPublicShell>
  );
}
