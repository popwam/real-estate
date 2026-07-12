import Link from "next/link";
import { cookies } from "next/headers";
import { normalizeLocale, tServer } from "@/i18n/server";
import { getPublicJobs, getPublicSite, PublicApiError, type ApiPublicJob, type TranslatedText } from "@/lib/public-api";
import { createSeoMetadata } from "@/lib/seo";

type CareersPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CareersPageProps) {
  const { slug } = await params;
  return createSeoMetadata({
    title: "Careers",
    description: "Open jobs and applicant intake.",
    path: `/sites/${slug}/careers`,
  });
}

export default async function CareersPage({ params }: CareersPageProps) {
  const { slug } = await params;
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const [site, jobs] = await Promise.all([getSite(slug), getJobs(slug)]);

  if (!site || site.mode === "DISABLED" || site.disabled) {
    return <State title={tServer(locale, "careers.notAvailable")} body={tServer(locale, "careers.notAvailableBody")} />;
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Link className="text-sm font-semibold text-[var(--color-accent)]" href={`/sites/${slug}`}>{site.organization.name}</Link>
          <h1 className="mt-3 text-4xl font-semibold">{tServer(locale, "careers.title")}</h1>
          <p className="mt-3 max-w-2xl text-[var(--color-muted)]">{tServer(locale, "careers.description")}</p>
          <Link className="ui-button ui-button-primary mt-6" href={`/sites/${slug}/apply`}>{tServer(locale, "careers.applyNow")}</Link>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {jobs.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <article key={job.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="text-lg font-semibold">{pickText(job.localizedTitle, locale) || job.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-muted)]">{pickText(job.description, locale) || tServer(locale, "careers.openRole")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link className="ui-button ui-button-secondary text-sm" href={`/sites/${slug}/careers/${job.id}`}>{tServer(locale, "careers.viewJob")}</Link>
                  <Link className="ui-button ui-button-primary text-sm" href={`/sites/${slug}/apply?jobId=${job.id}`}>{tServer(locale, "careers.applyNow")}</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <State title={tServer(locale, "careers.noJobs")} body={tServer(locale, "careers.noJobsBody")} />
        )}
      </section>
    </main>
  );
}

async function getSite(slug: string) {
  try {
    return await getPublicSite(slug);
  } catch {
    return null;
  }
}

async function getJobs(slug: string): Promise<ApiPublicJob[]> {
  try {
    return await getPublicJobs(slug);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return [];
    return [];
  }
}

function State({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-background)] px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
      </div>
    </main>
  );
}

function pickText(value: TranslatedText | null | undefined, locale: string) {
  return value?.[locale as keyof TranslatedText] || value?.en || value?.ar || value?.fr || "";
}
