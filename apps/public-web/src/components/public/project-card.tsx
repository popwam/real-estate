import Link from "next/link";
import type { PublicProject } from "@/lib/mock-public-marketplace";

export function ProjectCard({ project }: { project: PublicProject }) {
  return (
    <article className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="h-52 bg-slate-200 bg-cover bg-center"
        style={{ backgroundImage: `url(${project.heroImageUrl})` }}
        aria-label={`${project.name} preview image`}
      />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <span>{project.city}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{project.district}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">{project.name}</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          By {project.developerName}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
        <dl className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-950">Price</dt>
            <dd>{project.priceLabel}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-950">Delivery</dt>
            <dd>{project.deliveryLabel}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.unitTypes.slice(0, 3).map((unitType) => (
            <span
              key={unitType.type}
              className="rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {unitType.type}
            </span>
          ))}
        </div>
        <Link
          href={`/projects/${project.slug}`}
          className="mt-5 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          View project
        </Link>
      </div>
    </article>
  );
}
