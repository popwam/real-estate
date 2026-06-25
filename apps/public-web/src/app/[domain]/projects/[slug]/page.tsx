import Link from "next/link";
import { notFound } from "next/navigation";
import { StickyCtaBar } from "@/components/cta/sticky-cta-bar";
import { ProjectContactPanel } from "@/components/marketplace/project-contact-panel";
import { ProjectDetailHero } from "@/components/marketplace/project-detail-hero";
import { ProjectMediaGallery } from "@/components/marketplace/project-media-gallery";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { OrganizationTrustStrip } from "@/components/organization/organization-trust-strip";
import {
  getPublicProjectForOrganization,
  resolvePublicOrganizationByDomain,
} from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type DomainProjectDetailPageProps = {
  params: Promise<{ domain: string; slug: string }>;
};

export async function generateMetadata({ params }: DomainProjectDetailPageProps) {
  const { domain, slug } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);
  const project = organization
    ? await getPublicProjectForOrganization(organization.slug, slug)
    : null;

  return createSeoMetadata({
    title: project ? `${project.name} by ${organization?.name}` : "Project not found",
    description:
      project?.summary ??
      "The requested organization project could not be resolved publicly.",
    path: `/${domain}/projects/${slug}`,
    image: project?.ogImageUrl,
    noindex: true,
  });
}

export default async function DomainProjectDetailPage({
  params,
}: DomainProjectDetailPageProps) {
  const { domain, slug } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);
  const project = organization
    ? await getPublicProjectForOrganization(organization.slug, slug)
    : null;

  if (!organization || !project) {
    notFound();
  }

  const location = [project.city, project.district, project.address]
    .filter(Boolean)
    .join(", ");

  return (
    <OrganizationPublicShell domain={domain} organization={organization}>
      <ProjectDetailHero project={project} />
      <OrganizationTrustStrip
        organization={organization}
        projectCount={organization.projects.length}
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.64fr_0.36fr] lg:items-start lg:py-14">
        <div className="grid gap-10">
          <ProjectMediaGallery project={project} />

          <section className="ui-card p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              {organization.name}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
              Project overview
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
              {project.summary}
            </p>
            {project.highlights.length > 0 ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm font-medium text-[var(--color-foreground)]"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="ui-card p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Location
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                {location || "Location details are available on request."}
              </p>
            </article>

            <article className="ui-card p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Organization
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Published by{" "}
                <Link
                  href={`/${domain}`}
                  className="font-semibold text-[var(--color-foreground)] underline"
                >
                  {organization.name}
                </Link>
                .
              </p>
            </article>
          </section>

          {project.unitTypes.length > 0 ? (
            <section className="ui-card p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Units and inventory summary
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {project.unitTypes.map((unitType) => (
                  <article
                    key={unitType.type}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <h3 className="font-semibold text-[var(--color-foreground)]">
                      {unitType.type}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {unitType.bedrooms} / {unitType.sizeRange}
                    </p>
                    {project.hasPrice ? (
                      <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">
                        From {unitType.startingPrice}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {project.hasPaymentPlan ? (
            <section className="ui-card p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Payment plan
              </h2>
              <dl className="mt-6 grid gap-4 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                <DetailFact label="Down payment" value={project.paymentPlan.downPayment} />
                <DetailFact label="Installments" value={project.paymentPlan.installments} />
                <DetailFact label="Delivery" value={project.paymentPlan.delivery} />
                <DetailFact label="Maintenance" value={project.paymentPlan.maintenance} />
              </dl>
            </section>
          ) : null}
        </div>

        <ProjectContactPanel project={project} />
      </section>

      <StickyCtaBar
        label={`Interested in ${project.name}?`}
        whatsappUrl={project.developerContact?.whatsappUrl}
        avoidBottomNav={false}
      />
    </OrganizationPublicShell>
  );
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <dt className="font-semibold text-[var(--color-foreground)]">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
