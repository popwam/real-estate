import Link from "next/link";
import type { PublicProject } from "@/lib/mock-public-marketplace";

type OrganizationProjectsSectionProps = {
  domain: string;
  projects: PublicProject[];
};

export function OrganizationProjectsSection({
  domain,
  projects,
}: OrganizationProjectsSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Public portfolio
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">
            Open-marketplace projects
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Organization project lists use the same public gate: active projects
            with open-marketplace visibility only.
          </p>
        </div>
        <Link
          href={`/${domain}/projects`}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          View all organization projects
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.slug}
              className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm"
            >
              <div
                className="h-44 bg-slate-200 bg-cover bg-center"
                style={{ backgroundImage: `url(${project.heroImageUrl})` }}
              />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {project.city} / {project.district}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">
                  {project.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {project.summary}
                </p>
                <Link
                  href={`/${domain}/projects/${project.slug}`}
                  className="mt-5 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  View project
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded border border-dashed border-slate-300 bg-white p-8 text-center">
          <h3 className="text-xl font-semibold text-slate-950">
            No public projects available
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Private, hidden, selected-broker, and approved-brokerage inventory is
            not shown on public organization pages.
          </p>
        </div>
      )}
    </section>
  );
}
