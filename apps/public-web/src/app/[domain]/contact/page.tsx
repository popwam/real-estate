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
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">
            Contact {organization.name}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            Send a public inquiry and the organization can follow up through
            your preferred contact method.
          </p>
        </div>
      </section>
      <OrganizationContactSection organization={organization} />
    </OrganizationPublicShell>
  );
}
