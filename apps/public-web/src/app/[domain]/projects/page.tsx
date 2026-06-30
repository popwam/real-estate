import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { OrganizationProjectsSection } from "@/components/organization/organization-projects-section";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { OrganizationTrustStrip } from "@/components/organization/organization-trust-strip";
import { normalizeLocale, tServer } from "@/i18n/server";
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
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const t = (key: string, params?: Record<string, string | number>) => tServer(locale, key, params);
  const organization = await resolvePublicOrganizationByDomain(domain);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationPublicShell domain={domain} organization={organization} locale={locale}>
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {t("domainProjects.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">
            {organization.name} projects
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            {t("domainProjects.description", { count: organization.projects.length })}
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
        title={t("domainProjects.portfolio")}
        intro={t("domainProjects.portfolioIntro")}
        showViewAll={false}
      />
    </OrganizationPublicShell>
  );
}
