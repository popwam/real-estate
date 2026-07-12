import { cookies } from "next/headers";
import { normalizeLocale, tServer } from "@/i18n/server";
import { createSeoMetadata } from "@/lib/seo";
import { PublicApplicationForm } from "./public-application-form";

type ApplyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ jobId?: string }>;
};

export async function generateMetadata({ params }: ApplyPageProps) {
  const { slug } = await params;
  return createSeoMetadata({
    title: "Apply",
    description: "Submit a private application for HR review.",
    path: `/sites/${slug}/apply`,
    noindex: true,
  });
}

export default async function ApplyPage({ params, searchParams }: ApplyPageProps) {
  const { slug } = await params;
  const { jobId } = await searchParams;
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 text-[var(--color-foreground)] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-semibold">{tServer(locale, "careers.submitApplication")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">{tServer(locale, "careers.applyPrivacy")}</p>
        <PublicApplicationForm slug={slug} jobId={jobId} />
      </div>
    </main>
  );
}
