import { notFound } from "next/navigation";
import { OrganizationContactSection } from "@/components/organization/organization-contact-section";
import { OrganizationHero } from "@/components/organization/organization-hero";
import { OrganizationProjectsSection } from "@/components/organization/organization-projects-section";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { OrganizationTrustStrip } from "@/components/organization/organization-trust-strip";
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
      <OrganizationHero
        organization={organization}
        domain={domain}
        domainLabel={resolution.canonicalHost}
      />
      <OrganizationTrustStrip
        organization={organization}
        projectCount={organization.projects.length}
      />
      <OrganizationProjectsSection domain={domain} projects={organization.projects} />
      <OrganizationContactSection organization={organization} />
    </OrganizationPublicShell>
  );
}
