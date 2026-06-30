import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { OrganizationContactPanel } from "@/components/organization/organization-contact-panel";
import { OrganizationProfileHero } from "@/components/organization/organization-profile-hero";
import { OrganizationTrustStrip } from "@/components/organization/organization-trust-strip";
import { normalizeLocale, tServer } from "@/i18n/server";
import { getPublicBrokerageBySlug } from "@/lib/public-data";
import { PublicApiError } from "@/lib/public-api";
import { createSeoMetadata } from "@/lib/seo";

type BrokeragePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BrokeragePageProps) {
  const { slug } = await params;
  const brokerage = await getBrokerageOrNull(slug);

  return createSeoMetadata({
    title: brokerage?.name ?? "Brokerage not found",
    description:
      brokerage?.summary ?? "The requested public brokerage profile could not be found.",
    path: `/brokerages/${slug}`,
    image: brokerage?.ogImageUrl,
  });
}

export default async function BrokerageProfilePage({ params }: BrokeragePageProps) {
  const { slug } = await params;
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const t = (key: string) => tServer(locale, key);
  const brokerage = await getBrokerageOrNull(slug);

  if (!brokerage) {
    notFound();
  }

  return (
    <div className="bg-[var(--color-background)]">
      <OrganizationProfileHero
        organization={brokerage}
        eyebrow={t("brokerage.profile.eyebrow")}
        primaryHref="#contact"
        primaryLabel={t("brokerage.profile.contact")}
      />
      <OrganizationTrustStrip organization={brokerage} />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.36fr_0.64fr]">
        <aside className="ui-card p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
            {t("brokerage.profile.overview")}
          </h2>
          <dl className="mt-5 grid gap-4 text-sm text-[var(--color-muted)]">
            {brokerage.serviceAreas?.length ? (
              <div>
                <dt className="font-semibold text-[var(--color-foreground)]">
                  {t("brokerage.profile.marketCoverage")}
                </dt>
                <dd>{brokerage.serviceAreas.join(", ")}</dd>
              </div>
            ) : null}
            {brokerage.brokerCountLabel ? (
              <div>
                <dt className="font-semibold text-[var(--color-foreground)]">
                  {t("brokerage.profile.team")}
                </dt>
                <dd>{brokerage.brokerCountLabel}</dd>
              </div>
            ) : null}
          </dl>
        </aside>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {t("brokerage.profile.services")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
            {t("brokerage.profile.servicesTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {t("brokerage.profile.servicesDescription")}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {brokerage.highlights.map((highlight) => (
              <article key={highlight} className="ui-card p-5">
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  {highlight}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6">
          <OrganizationContactPanel organization={brokerage} />
        </div>
      </section>
    </div>
  );
}

async function getBrokerageOrNull(slug: string) {
  try {
    return await getPublicBrokerageBySlug(slug);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
