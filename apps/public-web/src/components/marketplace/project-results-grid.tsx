import Link from "next/link";
import { ProjectCard } from "@/components/public/project-card";
import type { PublicProject } from "@/lib/mock-public-marketplace";

type ProjectResultsGridProps = {
  projects: PublicProject[];
};

export function ProjectResultsGrid({ projects }: ProjectResultsGridProps) {
  if (!projects.length) {
    return (
      <div className="ui-card border-dashed p-8 text-center sm:p-10">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          No projects match these filters
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
          Try broadening the city, district, property type, or price filter. New
          public listings appear here as they become available.
        </p>
        <Link href="/projects" className="ui-button ui-button-primary mt-6">
          View all projects
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
