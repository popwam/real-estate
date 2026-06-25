import Link from "next/link";
import { ProjectMediaVisual } from "@/components/marketplace/project-media-visual";
import type { PublicProject } from "@/lib/mock-public-marketplace";

type OrganizationProjectGridProps = {
  domain?: string;
  projects: PublicProject[];
  emptyTitle?: string;
  emptyBody?: string;
};

export function OrganizationProjectGrid({
  domain,
  projects,
  emptyTitle = "No public projects are available",
  emptyBody = "Projects will appear here when they are approved for public viewing.",
}: OrganizationProjectGridProps) {
  if (!projects.length) {
    return (
      <div className="ui-card border-dashed p-8 text-center">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {emptyTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const href = domain
          ? `/${domain}/projects/${project.slug}`
          : `/projects/${project.slug}`;
        const location = [project.city, project.district].filter(Boolean).join(" / ");

        return (
          <article key={project.slug} className="ui-card overflow-hidden">
            <ProjectMediaVisual
              imageUrl={project.heroImageUrl}
              label={`${project.name} project preview`}
              className="h-48"
            />
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                {location || "Public project"}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--color-foreground)]">
                {project.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {project.summary}
              </p>
              <dl className="mt-4 grid gap-3 text-sm text-[var(--color-muted)]">
                {project.propertyType ? (
                  <div>
                    <dt className="font-semibold text-[var(--color-foreground)]">
                      Type
                    </dt>
                    <dd>{project.propertyType}</dd>
                  </div>
                ) : null}
                {project.hasPrice ? (
                  <div>
                    <dt className="font-semibold text-[var(--color-foreground)]">
                      Pricing
                    </dt>
                    <dd>{project.priceLabel}</dd>
                  </div>
                ) : null}
              </dl>
              <Link href={href} className="ui-button ui-button-primary mt-5">
                View project
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
