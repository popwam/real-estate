import { notFound } from "next/navigation";
import { OrganizationContactSection } from "@/components/organization/organization-contact-section";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { resolvePublicOrganizationByDomain } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type DomainContactPageProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: DomainContactPageProps) {
  const { domain } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);

  return createSeoMetadata({
    title: organization ? `Contact ${organization.name}` : "Contact organization",
    description:
      organization?.summary ?? "The requested organization contact page was not found.",
    path: `/${domain}/contact`,
    image: organization?.ogImageUrl,
    noindex: true,
  });
}

export default async function DomainContactPage({ params }: DomainContactPageProps) {
  const { domain } = await params;
  const organization = await resolvePublicOrganizationByDomain(domain);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationPublicShell domain={domain} organization={organization}>
      <OrganizationContactSection organization={organization} />
    </OrganizationPublicShell>
  );
}
