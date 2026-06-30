import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { StickyCtaBar } from "@/components/cta/sticky-cta-bar";
import { ProjectContactPanel } from "@/components/marketplace/project-contact-panel";
import { ProjectDetailHero } from "@/components/marketplace/project-detail-hero";
import { ProjectMediaGallery } from "@/components/marketplace/project-media-gallery";
import { ProjectTrustStrip } from "@/components/marketplace/project-trust-strip";
import { normalizeLocale, tServer } from "@/i18n/server";
import { getPublicProjectBySlug } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);

  if (!project) {
    return createSeoMetadata({
      title: tServer(locale, "project.meta.notFoundTitle"),
      description: tServer(locale, "project.meta.notFoundDescription"),
      path: `/projects/${slug}`,
    });
  }

  return createSeoMetadata({
    title: project.name,
    description: project.summary,
    path: `/projects/${project.slug}`,
    image: project.ogImageUrl || undefined,
  });
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const t = (key: string, params?: Record<string, string | number>) =>
    tServer(locale, key, params);

  if (!project) {
    notFound();
  }

  const location = [project.city, project.district, project.address]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-[var(--color-background)]">
      <ProjectDetailHero project={project} />

      <ProjectTrustStrip />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.64fr_0.36fr] lg:items-start lg:py-14">
        <div className="grid gap-10">
          <ProjectMediaGallery project={project} locale={locale} />

          <section className="ui-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
              {t("project.detail.overview")}
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
              {project.summary}
            </p>
            {project.highlights.length > 0 ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm font-medium text-[var(--color-foreground)]"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="ui-card p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                {t("project.detail.location")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                {location || t("project.detail.locationOnRequest")}
              </p>
            </article>

            <article className="ui-card p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                {t("project.detail.developer")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                {t("project.detail.publishedBy")}{" "}
                <Link
                  href={`/developers/${project.developerSlug}`}
                  className="font-semibold text-[var(--color-foreground)] underline"
                >
                  {project.developerName}
                </Link>
                .
              </p>
            </article>
          </section>

          {project.unitTypes.length > 0 ? (
            <section className="ui-card p-5 sm:p-6">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                  {t("project.detail.unitsSummary")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {t("project.detail.unitsDescription")}
                </p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {project.unitTypes.map((unitType) => (
                  <article
                    key={unitType.type}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <h3 className="font-semibold text-[var(--color-foreground)]">
                      {unitType.type}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {unitType.bedrooms} / {unitType.sizeRange}
                    </p>
                    {project.hasPrice ? (
                      <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">
                        {t("project.detail.fromPrice", { price: unitType.startingPrice })}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {project.hasPaymentPlan ? (
            <section className="ui-card p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                {t("project.detail.paymentPlan")}
              </h2>
              <dl className="mt-6 grid gap-4 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                <DetailFact label={t("project.detail.downPayment")} value={project.paymentPlan.downPayment} />
                <DetailFact label={t("project.detail.installments")} value={project.paymentPlan.installments} />
                <DetailFact label={t("project.detail.delivery")} value={project.paymentPlan.delivery} />
                <DetailFact label={t("project.detail.maintenance")} value={project.paymentPlan.maintenance} />
              </dl>
            </section>
          ) : null}
        </div>

        <ProjectContactPanel project={project} />
      </section>

      <StickyCtaBar
        label={t("project.detail.interestedIn", { name: project.name })}
        whatsappUrl={project.developerContact?.whatsappUrl}
      />
    </div>
  );
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <dt className="font-semibold text-[var(--color-foreground)]">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
