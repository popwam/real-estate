import { notFound } from "next/navigation";
import { LandingPageRenderer } from "@/components/landing/landing-page-renderer";
import { OrganizationPublicShell } from "@/components/organization/organization-public-shell";
import { getMockLandingPageForDomain } from "@/lib/mock-landing-pages";
import { createSeoMetadata } from "@/lib/seo";

type DomainLandingPageProps = {
  params: Promise<{ domain: string; slug: string }>;
};

export async function generateMetadata({ params }: DomainLandingPageProps) {
  const { domain, slug } = await params;
  const landing = await getMockLandingPageForDomain(domain, slug);

  return createSeoMetadata({
    title: landing?.seoTitle ?? "Organization landing page not found",
    description:
      landing?.seoDescription ??
      "The requested organization landing page could not be resolved.",
    path: `/${domain}/landing/${slug}`,
    image: landing?.ogImage,
    noindex: landing?.noindex ?? true,
  });
}

export default async function DomainLandingPage({ params }: DomainLandingPageProps) {
  const { domain, slug } = await params;
  const landing = await getMockLandingPageForDomain(domain, slug);

  if (!landing) {
    notFound();
  }

  return (
    <OrganizationPublicShell domain={domain} organization={landing.organization}>
      <LandingPageRenderer landing={landing} />
    </OrganizationPublicShell>
  );
}
