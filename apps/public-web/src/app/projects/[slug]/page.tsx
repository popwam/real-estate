import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLeadForm } from "@/components/forms/public-lead-form";
import { getPublicProjectBySlug } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    return createSeoMetadata({
      title: "Project not found",
      description: "The requested public project could not be found.",
      path: `/projects/${slug}`,
    });
  }

  return createSeoMetadata({
    title: project.name,
    description: project.summary,
    path: `/projects/${project.slug}`,
    image: project.heroImageUrl,
  });
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="bg-white">
      <section
        className="min-h-[460px] bg-cover bg-center"
        style={{ backgroundImage: `url(${project.heroImageUrl})` }}
        aria-label={`${project.name} project image`}
      >
        <div className="min-h-[460px] bg-slate-950/55">
          <div className="mx-auto flex min-h-[460px] max-w-7xl flex-col justify-end px-6 py-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              {project.city} / {project.district}
            </p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight text-white">
              {project.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
              {project.summary}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {project.galleryImageUrls.map((imageUrl, index) => (
            <div
              key={imageUrl}
              className="h-48 rounded bg-slate-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
              aria-label={`${project.name} gallery image ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded border border-slate-200 bg-slate-50 p-6">
          <dl className="grid gap-5 text-sm">
            <div>
              <dt className="font-semibold text-slate-950">Developer</dt>
              <dd className="mt-1 text-slate-700">
                <Link
                  href={`/developers/${project.developerSlug}`}
                  className="underline hover:text-slate-950"
                >
                  {project.developerName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Starting price</dt>
              <dd className="mt-1 text-slate-700">{project.priceLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Unit mix</dt>
              <dd className="mt-1 text-slate-700">{project.unitMix}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Delivery</dt>
              <dd className="mt-1 text-slate-700">{project.deliveryLabel}</dd>
            </div>
          </dl>
          <div className="mt-6 rounded border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              Contact developer
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Public lead capture is routed through POPWAM without exposing
              private inventory or broker assignment data.
            </p>
          </div>
        </aside>
        <div>
          <h2 className="text-3xl font-semibold text-slate-950">Overview</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This page uses public-safe marketplace fields only. Unit numbers,
            reservation data, lead claims, and deal information are not exposed.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-slate-700">
            {project.highlights.map((highlight) => (
              <li key={highlight} className="rounded border border-slate-200 p-4">
                {highlight}
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-950">
                Payment plan summary
              </h3>
              <dl className="mt-5 grid gap-4 text-sm text-slate-700">
                <div>
                  <dt className="font-semibold text-slate-950">Down payment</dt>
                  <dd>{project.paymentPlan.downPayment}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Installments</dt>
                  <dd>{project.paymentPlan.installments}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Delivery</dt>
                  <dd>{project.paymentPlan.delivery}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Maintenance</dt>
                  <dd>{project.paymentPlan.maintenance}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-950">
                Available unit types
              </h3>
              <div className="mt-5 grid gap-3">
                {project.unitTypes.map((unitType) => (
                  <div
                    key={unitType.type}
                    className="rounded border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-950">{unitType.type}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {unitType.bedrooms} / {unitType.sizeRange}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-950">
                      From {unitType.startingPrice}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-10 rounded border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-950">
              Register interest
            </h3>
            <div className="mt-5">
              <PublicLeadForm
                ctaLabel="Send interest"
                organizationSlug={project.developerSlug}
                projectSlug={project.slug}
                projectInterest={project.name}
                whatsappUrl={project.developerContact?.whatsappUrl}
              />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
