import { PublicLeadForm } from "@/components/forms/public-lead-form";
import type { ResolvedLandingPage } from "@/lib/mock-landing-pages";

export function LandingConversionSection({
  landing,
}: {
  landing: ResolvedLandingPage;
}) {
  const project = landing.project;

  return (
    <section
      id="lead-form"
      className="border-y border-[var(--color-border)] bg-[var(--color-background)]"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.38fr_0.62fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Register interest
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
            Request campaign details
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Share your details and the project team can follow up using your
            preferred contact method.
          </p>
        </div>
        <PublicLeadForm
          ctaLabel={landing.ctaLabel}
          organizationSlug={landing.organization.slug}
          projectSlug={project?.slug}
          projectInterest={project?.name}
          whatsappUrl={landing.organization.contact?.whatsappUrl}
        />
      </div>
    </section>
  );
}
