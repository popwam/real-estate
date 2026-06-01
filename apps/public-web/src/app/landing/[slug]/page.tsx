import { notFound } from "next/navigation";
import { LandingPageRenderer } from "@/components/landing/landing-page-renderer";
import { getMockLandingPageBySlug } from "@/lib/mock-landing-pages";
import { createSeoMetadata } from "@/lib/seo";

type LandingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LandingPageProps) {
  const { slug } = await params;
  const landing = await getMockLandingPageBySlug(slug);

  return createSeoMetadata({
    title: landing?.seoTitle ?? "Landing page not found",
    description:
      landing?.seoDescription ?? "The requested public landing page was not found.",
    path: `/landing/${slug}`,
    image: landing?.ogImage,
    noindex: landing?.noindex ?? true,
  });
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = await params;
  const landing = await getMockLandingPageBySlug(slug);

  if (!landing) {
    notFound();
  }

  return <LandingPageRenderer landing={landing} />;
}
