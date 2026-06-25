import Link from "next/link";
import { ProjectMediaVisual } from "@/components/marketplace/project-media-visual";
import { OrganizationVerificationBadge } from "@/components/organization/organization-verification-badge";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationProfileHeroProps = {
  organization: PublicOrganization;
  eyebrow?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  domainLabel?: string;
};

export function OrganizationProfileHero({
  organization,
  eyebrow,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  domainLabel,
}: OrganizationProfileHeroProps) {
  const typeLabel =
    organization.type === "DEVELOPER" ? "Developer profile" : "Brokerage profile";
  const location = [organization.city, organization.country].filter(Boolean).join(", ");

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {eyebrow ?? typeLabel}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-5xl">
            {organization.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)] sm:text-lg sm:leading-8">
            {organization.summary}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <OrganizationVerificationBadge label={organization.verifiedLabel} />
            {location ? <span className="ui-badge">{location}</span> : null}
            {domainLabel ? <span className="ui-badge">{domainLabel}</span> : null}
          </div>
          {(primaryHref || secondaryHref) ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryHref && primaryLabel ? (
                <Link href={primaryHref} className="ui-button ui-button-primary">
                  {primaryLabel}
                </Link>
              ) : null}
              {secondaryHref && secondaryLabel ? (
                <Link href={secondaryHref} className="ui-button ui-button-secondary">
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <ProjectMediaVisual
          imageUrl={organization.heroImageUrl}
          label={`${organization.name} public profile media`}
          className="min-h-80 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] sm:min-h-96"
        />
      </div>
    </section>
  );
}
