import Link from "next/link";
import { notFound } from "next/navigation";
import { OrganizationContactSection } from "@/components/organization/organization-contact-section";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
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

  return (
    <OrganizationPublicShell domain={domain} organization={organization}>
      <section
        className="min-h-[420px] bg-cover bg-center"
        style={{ backgroundImage: `url(${project.heroImageUrl})` }}
      >
        <div className="min-h-[420px] bg-slate-950/60">
          <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col justify-end px-6 py-12 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              {organization.name} / {project.city}
            </p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight">
              {project.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
              {project.summary}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Organization project context
          </p>
          <dl className="mt-5 grid gap-4 text-sm text-slate-700">
            <div>
              <dt className="font-semibold text-slate-950">Organization</dt>
              <dd>{organization.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Price</dt>
              <dd>{project.priceLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Delivery</dt>
              <dd>{project.deliveryLabel}</dd>
            </div>
          </dl>
          <Link
            href={`/${domain}/contact`}
            className="mt-6 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Contact placeholder
          </Link>
        </aside>
        <div>
          <h2 className="text-3xl font-semibold text-slate-950">Public project</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            This organization-context page uses the same public-only adapter as
            the main marketplace. No private inventory, lead claim, reservation,
            deal, or commission data is shown.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {project.unitTypes.map((unitType) => (
              <div key={unitType.type} className="rounded border border-slate-200 p-5">
                <p className="font-semibold text-slate-950">{unitType.type}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {unitType.bedrooms} / {unitType.sizeRange}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-950">
                  From {unitType.startingPrice}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <OrganizationContactSection organization={organization} />
    </OrganizationPublicShell>
  );
}
