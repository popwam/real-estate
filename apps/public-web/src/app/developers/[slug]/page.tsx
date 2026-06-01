import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/public/project-card";
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
  });
}

export default async function DeveloperProfilePage({ params }: DeveloperPageProps) {
  const { slug } = await params;
  const developer = await getPublicDeveloperBySlug(slug);

  if (!developer) {
    notFound();
  }

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Developer profile
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">
            {developer.name}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            {developer.summary}
          </p>
          <p className="mt-4 text-sm font-medium text-slate-700">
            {developer.city}, {developer.country}
          </p>
          <div className="mt-6 inline-flex rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
            {developer.verifiedLabel}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Developer overview
          </h2>
          <dl className="mt-5 grid gap-4 text-sm text-slate-700">
            <div>
              <dt className="font-semibold text-slate-950">Track record</dt>
              <dd>{developer.establishedLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Public portfolio</dt>
              <dd>{developer.projectCountLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Service areas</dt>
              <dd>{developer.serviceAreas?.join(", ")}</dd>
            </div>
          </dl>
          <ul className="mt-5 grid gap-3 text-sm text-slate-700">
            {developer.highlights.map((highlight) => (
              <li key={highlight} className="rounded bg-slate-50 p-3">
                {highlight}
              </li>
            ))}
          </ul>
          <Link
            href="/projects"
            className="mt-6 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Browse all projects
          </Link>
        </aside>
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Public project portfolio
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            These projects are returned through the public data adapter and
            filtered to active open-marketplace visibility only.
          </p>
          <div className="mt-6 grid gap-6">
            {developer.projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
