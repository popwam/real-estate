import Link from "next/link";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { ProjectResultsGrid } from "@/components/marketplace/project-results-grid";
import { ProjectTrustStrip } from "@/components/marketplace/project-trust-strip";
import { safeListFeaturedPublicProjects } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Verified Real Estate Marketplace",
  description:
    "Discover public real estate projects from participating organizations and send interest through POPWAM.",
});

export default async function Home() {
  const projects = await safeListFeaturedPublicProjects();

  return (
    <div className="bg-[var(--color-background)]">
      <MarketplaceHero featuredCount={projects.length} />

      <ProjectTrustStrip />

      <section id="featured-projects" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Featured projects
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
              Explore the current public collection
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Featured projects come from the same public data source as the
              marketplace. If none are available, buyers get a clear empty state
              instead of sample listings.
            </p>
          </div>
          <Link href="/projects" className="ui-button ui-button-secondary">
            View all projects
          </Link>
        </div>

        <div className="mt-8">
          {projects.length > 0 ? (
            <ProjectResultsGrid projects={projects} />
          ) : (
            <div className="ui-card border-dashed p-8 text-center sm:p-10">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                No public projects are available yet
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
                Approved projects will appear here when participating
                organizations publish them for public browsing.
              </p>
              <Link href="/projects" className="ui-button ui-button-primary mt-6">
                Browse projects
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Why POPWAM
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
              Public discovery connected to a real sales workflow.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Clear project facts",
                body: "Visitors see available public details without private records mixed in.",
              },
              {
                title: "Responsible contact",
                body: "Interest is submitted through the existing lead workflow for follow-up.",
              },
              {
                title: "Governed visibility",
                body: "Marketplace pages respect the publishing and visibility rules already configured.",
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
