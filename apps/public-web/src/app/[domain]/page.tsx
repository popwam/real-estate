import { notFound } from "next/navigation";
import { OrganizationContactSection } from "@/components/organization/organization-contact-section";
import { OrganizationHero } from "@/components/organization/organization-hero";
import { OrganizationProjectsSection } from "@/components/organization/organization-projects-section";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import {
  resolvePublicDomainContext,
  resolvePublicOrganizationByDomain,
} from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type DomainPageProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: DomainPageProps) {
  const { domain } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);

  return createSeoMetadata({
    title: organization?.name ?? "Organization site not found",
    description:
      organization?.summary ??
      "The requested public organization site could not be resolved.",
    path: `/${domain}`,
    image: organization?.ogImageUrl,
    noindex: true,
  });
}

export default async function DomainHomePage({ params }: DomainPageProps) {
  const { domain } = await params;
  const [organization, resolution] = await Promise.all([
    resolvePublicOrganizationByDomain(domain),
    resolvePublicDomainContext(domain),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationPublicShell domain={domain} organization={organization}>
      <OrganizationHero organization={organization} domainLabel={resolution.canonicalHost} />
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-3">
        <div className="rounded border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-950">Resolution mode</p>
          <p className="mt-2 text-sm text-slate-600">{resolution.kind}</p>
        </div>
        <div className="rounded border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-950">Public profile</p>
          <p className="mt-2 text-sm text-slate-600">
            {organization.type === "DEVELOPER" ? "Developer" : "Brokerage"} mock site
          </p>
        </div>
        <div className="rounded border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-950">Inventory policy</p>
          <p className="mt-2 text-sm text-slate-600">
            Active open-marketplace projects only
          </p>
        </div>
      </section>
      <OrganizationProjectsSection domain={domain} projects={organization.projects} />
      <OrganizationContactSection organization={organization} />
    </OrganizationPublicShell>
  );
}
