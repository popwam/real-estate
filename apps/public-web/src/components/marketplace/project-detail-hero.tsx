import Link from "next/link";
import { ProjectMediaVisual } from "@/components/marketplace/project-media-visual";
import type { PublicProject } from "@/lib/mock-public-marketplace";

export function ProjectDetailHero({ project }: { project: PublicProject }) {
  const location = [project.city, project.district].filter(Boolean).join(", ");
  const facts = [
    project.propertyType ? { label: "Type", value: project.propertyType } : null,
    project.hasPrice ? { label: "Pricing", value: project.priceLabel } : null,
    project.deliveryLabel ? { label: "Delivery", value: project.deliveryLabel } : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {location || "Public project"}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-5xl">
            {project.name}
          </h1>
          <p className="mt-4 text-base font-medium text-[var(--color-muted)]">
            By{" "}
            <Link href={`/developers/${project.developerSlug}`} className="underline hover:text-[var(--color-foreground)]">
              {project.developerName}
            </Link>
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            {project.summary}
          </p>
          {facts.length > 0 ? (
            <dl className="mt-7 grid gap-3 sm:grid-cols-3">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {fact.label}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="mt-8">
            <a href="#lead-form" className="ui-button ui-button-primary">
              Request details
            </a>
          </div>
        </div>

        <ProjectMediaVisual
          imageUrl={project.heroImageUrl}
          label={`${project.name} project media`}
          className="min-h-80 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] sm:min-h-96"
        />
      </div>
    </section>
  );
}
