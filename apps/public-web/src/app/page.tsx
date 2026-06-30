import Link from "next/link";
import { cookies } from "next/headers";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { ProjectResultsGrid } from "@/components/marketplace/project-results-grid";
import { ProjectTrustStrip } from "@/components/marketplace/project-trust-strip";
import { normalizeLocale, tServer } from "@/i18n/server";
import { safeListFeaturedPublicProjects } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Verified Real Estate Marketplace",
  description:
    "Discover public real estate projects from participating organizations and send interest through POPWAM.",
});

export default async function Home() {
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const t = (key: string, params?: Record<string, string | number>) =>
    tServer(locale, key, params);
  const projects = await safeListFeaturedPublicProjects();

  return (
    <div className="bg-[var(--color-background)]">
      <MarketplaceHero
        featuredCount={projects.length}
        copy={{
          eyebrow: t("marketplace.hero.eyebrow"),
          title: t("marketplace.hero.title"),
          description: t("marketplace.hero.description"),
          browse: t("home.empty.browse"),
          focusEyebrow: t("marketplace.hero.focusEyebrow"),
          focusTitle: t("marketplace.hero.focusTitle"),
          focusDescription: t("marketplace.hero.focusDescription"),
          signals: [
            t("marketplace.hero.signal.verified"),
            t("marketplace.hero.signal.inventory"),
            t("marketplace.hero.signal.crm"),
          ],
          featuredCount: t("marketplace.hero.featuredCount", {
            count: projects.length,
          }),
          featuredEmpty: t("marketplace.hero.featuredEmpty"),
        }}
      />

      <ProjectTrustStrip />

      <section id="featured-projects" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              {t("home.featured.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
              {t("home.featured.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              {t("home.featured.description")}
            </p>
          </div>
          <Link href="/projects" className="ui-button ui-button-secondary">
            {t("home.featured.viewAll")}
          </Link>
        </div>

        <div className="mt-8">
          {projects.length > 0 ? (
            <ProjectResultsGrid projects={projects} locale={locale} />
          ) : (
            <div className="ui-card border-dashed p-8 text-center sm:p-10">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                {t("home.empty.title")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
                {t("home.empty.description")}
              </p>
              <Link href="/projects" className="ui-button ui-button-primary mt-6">
                {t("home.empty.browse")}
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              {t("home.why.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
              {t("home.why.title")}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: t("home.why.facts.title"),
                body: t("home.why.facts.body"),
              },
              {
                title: t("home.why.contact.title"),
                body: t("home.why.contact.body"),
              },
              {
                title: t("home.why.visibility.title"),
                body: t("home.why.visibility.body"),
              },
            ].map((item) => (
              <article key={item.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
