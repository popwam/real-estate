 "use client";

import { StickyCtaBar } from "@/components/cta/sticky-cta-bar";
import { LandingConversionSection } from "@/components/landing/landing-conversion-section";
import { LandingProjectShowcase } from "@/components/landing/landing-project-showcase";
import { ProjectMediaVisual } from "@/components/marketplace/project-media-visual";
import { OrganizationVerificationBadge } from "@/components/organization/organization-verification-badge";
import { useI18n } from "@/i18n";
import type { ResolvedLandingPage } from "@/lib/mock-landing-pages";

export function LandingPageRenderer({ landing }: { landing: ResolvedLandingPage }) {
  const project = landing.project;
  const { t } = useI18n();

  return (
    <div className="bg-[var(--color-background)]">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              {t("landing.featuredOpportunity")}
            </p>
            <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl">
              {landing.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--color-muted)] sm:text-lg sm:leading-8">
              {landing.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#lead-form" className="ui-button ui-button-primary">
                {landing.ctaLabel}
              </a>
              {project ? (
                <a href="#project" className="ui-button ui-button-secondary">
                  {t("landing.viewProjectDetails")}
                </a>
              ) : null}
            </div>
          </div>

          <ProjectMediaVisual
            imageUrl={landing.heroImage}
            label={`${landing.title} campaign media`}
            className="min-h-80 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] sm:min-h-96"
          />
        </div>
      </section>

      {project ? (
        <div id="project" className="scroll-mt-24">
          <LandingProjectShowcase project={project} />
        </div>
      ) : null}

      {landing.amenities.length > 0 ? (
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              {t("landing.highlights")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
              {t("landing.campaignHighlights")}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {landing.amenities.map((amenity) => (
                <article key={amenity} className="ui-card p-5">
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {amenity}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.38fr_0.62fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {t("common.organization")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
            {t("landing.publishedBy", { name: landing.organization.name })}
          </h2>
        </div>
        <div className="ui-card p-5 sm:p-6">
          <OrganizationVerificationBadge label={landing.organization.verifiedLabel} />
          <p className="mt-4 text-lg font-semibold text-[var(--color-foreground)]">
            {landing.organization.name}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            {t("landing.organizationReview")}
          </p>
        </div>
      </section>

      <LandingConversionSection landing={landing} />

      {landing.faq.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-3xl font-semibold text-[var(--color-foreground)]">
            {t("landing.questions")}
          </h2>
          <div className="mt-6 grid gap-4">
            {landing.faq.map((item) => (
              <details key={item.question} className="ui-card p-5">
                <summary className="cursor-pointer font-semibold text-[var(--color-foreground)]">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <StickyCtaBar
        label={landing.ctaLabel}
        whatsappUrl={landing.organization.contact?.whatsappUrl}
        avoidBottomNav={false}
      />
    </div>
  );
}
