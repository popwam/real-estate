import Link from "next/link";
import { cookies } from "next/headers";
import { normalizeLocale, tServer } from "@/i18n/server";
import { getPublicJob, PublicApiError, type TranslatedText } from "@/lib/public-api";
import { createSeoMetadata } from "@/lib/seo";

type JobPageProps = {
  params: Promise<{ slug: string; jobId: string }>;
};

export async function generateMetadata({ params }: JobPageProps) {
  const { slug, jobId } = await params;
  try {
    const job = await getPublicJob(slug, jobId);
    return createSeoMetadata({
      title: job.title,
      description: pickText(job.description, "en") || "Open role.",
      path: `/sites/${slug}/careers/${jobId}`,
    });
  } catch {
    return createSeoMetadata({ title: "Job opening", description: "Open role.", path: `/sites/${slug}/careers/${jobId}`, noindex: true });
  }
}

export default async function PublicJobPage({ params }: JobPageProps) {
  const { slug, jobId } = await params;
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const job = await getJob(slug, jobId);
  if (!job) {
    return <main className="grid min-h-screen place-items-center px-4 text-center"><div><h1 className="text-3xl font-semibold">{tServer(locale, "careers.jobNotFound")}</h1><p className="mt-2 text-[var(--color-muted)]">{tServer(locale, "careers.jobNotFoundBody")}</p></div></main>;
  }
  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link className="text-sm font-semibold text-[var(--color-accent)]" href={`/sites/${slug}/careers`}>{tServer(locale, "careers.title")}</Link>
        <h1 className="mt-3 text-4xl font-semibold">{pickText(job.localizedTitle, locale) || job.title}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{job.employmentType ?? tServer(locale, "common.notSet")} · {job.workMode ?? tServer(locale, "common.notSet")}</p>
        <section className="mt-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-xl font-semibold">{tServer(locale, "careers.descriptionHeading")}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--color-muted)]">{pickText(job.description, locale) || tServer(locale, "careers.openRole")}</p>
        </section>
        <section className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-xl font-semibold">{tServer(locale, "careers.requirementsHeading")}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--color-muted)]">{pickText(job.requirements, locale) || tServer(locale, "careers.requirementsFallback")}</p>
        </section>
        <Link className="ui-button ui-button-primary mt-6" href={`/sites/${slug}/apply?jobId=${job.id}`}>{tServer(locale, "careers.applyNow")}</Link>
      </section>
    </main>
  );
}

async function getJob(slug: string, jobId: string) {
  try {
    return await getPublicJob(slug, jobId);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    return null;
  }
}

function pickText(value: TranslatedText | null | undefined, locale: string) {
  return value?.[locale as keyof TranslatedText] || value?.en || value?.ar || value?.fr || "";
}
