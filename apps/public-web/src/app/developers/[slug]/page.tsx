import { notFound } from "next/navigation";
import { OrganizationContactPanel } from "@/components/organization/organization-contact-panel";
import { OrganizationProfileHero } from "@/components/organization/organization-profile-hero";
import { OrganizationProjectGrid } from "@/components/organization/organization-project-grid";
import { OrganizationTrustStrip } from "@/components/organization/organization-trust-strip";
import { getPublicDeveloperBySlug } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type DeveloperPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DeveloperPageProps) {
  const { slug } = await params;
  const developer = await getPublicDeveloperBySlug(slug);

  return createSeoMetadata({
    title: developer?.name ?? "Developer not found",
    description:
      developer?.summary ?? "The requested public developer profile could not be found.",
    path: `/developers/${slug}`,
    image: developer?.ogImageUrl,
  });
}

export default async function DeveloperProfilePage({ params }: DeveloperPageProps) {
  const { slug } = await params;
  const developer = await getPublicDeveloperBySlug(slug);

  if (!developer) {
    notFound();
  }

  return (
    <div className="bg-[var(--color-background)]">
      <OrganizationProfileHero
        organization={developer}
        eyebrow="Developer profile"
        primaryHref="#projects"
        primaryLabel="View public projects"
        secondaryHref="#contact"
        secondaryLabel="Contact developer"
      />
      <OrganizationTrustStrip
        organization={developer}
        projectCount={developer.projects.length}
      />

      <section id="projects" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Projects
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
              Public project portfolio
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Projects appear here when this developer has approved them for
              public viewing.
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {developer.projects.length} project
            {developer.projects.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="mt-8">
          <OrganizationProjectGrid projects={developer.projects} />
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.36fr_0.64fr]">
          <aside className="ui-card p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              Developer overview
            </h2>
            <dl className="mt-5 grid gap-4 text-sm text-[var(--color-muted)]">
              {developer.establishedLabel ? (
                <div>
                  <dt className="font-semibold text-[var(--color-foreground)]">
                    Track record
                  </dt>
                  <dd>{developer.establishedLabel}</dd>
                </div>
              ) : null}
              {developer.serviceAreas?.length ? (
                <div>
                  <dt className="font-semibold text-[var(--color-foreground)]">
                    Service areas
                  </dt>
                  <dd>{developer.serviceAreas.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
          </aside>
          <div className="grid gap-4 md:grid-cols-3">
            {developer.highlights.map((highlight) => (
              <article key={highlight} className="ui-card p-5">
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  {highlight}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6">
        <OrganizationContactPanel organization={developer} />
      </section>
    </div>
  );
}
