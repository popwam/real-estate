import { notFound } from "next/navigation";
import { OrganizationProjectsSection } from "@/components/organization/organization-projects-section";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
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
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Organization projects
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">
            {organization.name} projects
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            This route is a mock organization-context project index. It filters out
            private, hidden, approved-brokerage, and selected-broker inventory.
          </p>
        </div>
      </section>
      <OrganizationProjectsSection domain={domain} projects={organization.projects} />
    </OrganizationPublicShell>
  );
}
