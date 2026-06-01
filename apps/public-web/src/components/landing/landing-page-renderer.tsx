import { StickyCtaBar } from "@/components/cta/sticky-cta-bar";
import { PublicLeadForm } from "@/components/forms/public-lead-form";
import { OrganizationVerificationBadge } from "@/components/organization/organization-verification-badge";
import type { ResolvedLandingPage } from "@/lib/mock-landing-pages";

export function LandingPageRenderer({ landing }: { landing: ResolvedLandingPage }) {
  const project = landing.project;

  return (
    <div className="bg-white">
      <section
        className="min-h-[620px] bg-cover bg-center"
        style={{ backgroundImage: `url(${landing.heroImage})` }}
      >
        <div className="min-h-[620px] bg-slate-950/60">
          <div className="mx-auto flex min-h-[620px] max-w-7xl flex-col justify-end px-6 py-16 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              POPWAM landing page mock
            </p>
            <h1 className="mt-4 max-w-5xl text-5xl font-semibold leading-tight md:text-6xl">
              {landing.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">
              {landing.subtitle}
            </p>
            <div className="mt-8">
              <a
                href="#lead-form"
                className="rounded bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {landing.ctaLabel}
              </a>
            </div>
          </div>
        </div>
      </section>

      {project && (
        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Project highlight
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              {project.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {project.summary}
            </p>
          </div>
          <dl className="grid gap-4 rounded border border-slate-200 bg-slate-50 p-6 text-sm md:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-950">Starting price</dt>
              <dd className="mt-1 text-slate-700">{project.priceLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Delivery</dt>
              <dd className="mt-1 text-slate-700">{project.deliveryLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Location</dt>
              <dd className="mt-1 text-slate-700">
                {project.city}, {project.district}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Unit mix</dt>
              <dd className="mt-1 text-slate-700">{project.unitMix}</dd>
            </div>
          </dl>
        </section>
      )}

      {project && (
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold text-slate-950">Unit types</h2>
              <div className="mt-6 grid gap-4">
                {project.unitTypes.map((unitType) => (
                  <div key={unitType.type} className="rounded border border-slate-200 bg-white p-5">
                    <p className="font-semibold text-slate-950">{unitType.type}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {unitType.bedrooms} / {unitType.sizeRange}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      From {unitType.startingPrice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-slate-950">Payment plan</h2>
              <dl className="mt-6 grid gap-4 rounded border border-slate-200 bg-white p-6 text-sm">
                <div>
                  <dt className="font-semibold text-slate-950">Down payment</dt>
                  <dd>{project.paymentPlan.downPayment}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Installments</dt>
                  <dd>{project.paymentPlan.installments}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Maintenance</dt>
                  <dd>{project.paymentPlan.maintenance}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl font-semibold text-slate-950">Amenities</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {landing.amenities.map((amenity) => (
            <div key={amenity} className="rounded border border-slate-200 p-5 text-sm text-slate-700">
              {amenity}
            </div>
          ))}
        </div>
      </section>

      {project && (
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <h2 className="text-3xl font-semibold text-slate-950">Gallery placeholder</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {project.galleryImageUrls.map((imageUrl) => (
                <div
                  key={imageUrl}
                  className="h-56 rounded bg-slate-200 bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Trust
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">
            Developer and brokerage trust section
          </h2>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-6">
          <OrganizationVerificationBadge label={landing.organization.verifiedLabel} />
          <p className="mt-4 text-lg font-semibold text-slate-950">
            {landing.organization.name}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Official POPWAM verified profile placeholder. Verification details are
            mock-only until public organization APIs exist.
          </p>
        </div>
      </section>

      <section id="lead-form" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">
              Register interest
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              UTM values are captured in browser storage and submitted with the
              public contact request when API mode is enabled.
            </p>
          </div>
          <PublicLeadForm
            ctaLabel={landing.ctaLabel}
            organizationSlug={landing.organization.slug}
            projectSlug={project?.slug}
            projectInterest={project?.name}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl font-semibold text-slate-950">FAQ</h2>
        <div className="mt-6 grid gap-4">
          {landing.faq.map((item) => (
            <details key={item.question} className="rounded border border-slate-200 p-5">
              <summary className="cursor-pointer font-semibold text-slate-950">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <StickyCtaBar label={landing.ctaLabel} />
    </div>
  );
}
