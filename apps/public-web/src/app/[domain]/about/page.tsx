import { notFound } from "next/navigation";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { OrganizationVerificationBadge } from "@/components/organization/organization-verification-badge";
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
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded border border-slate-200 bg-slate-50 p-6">
          <OrganizationVerificationBadge label={organization.verifiedLabel} />
          <dl className="mt-6 grid gap-4 text-sm text-slate-700">
            <div>
              <dt className="font-semibold text-slate-950">Location</dt>
              <dd>
                {organization.city}, {organization.country}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Service areas</dt>
              <dd>{organization.serviceAreas?.join(", ")}</dd>
            </div>
          </dl>
        </aside>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            About
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">
            {organization.name}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {organization.summary}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {organization.highlights.map((highlight) => (
              <div key={highlight} className="rounded border border-slate-200 p-5">
                <p className="text-sm leading-6 text-slate-700">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </OrganizationPublicShell>
  );
}
