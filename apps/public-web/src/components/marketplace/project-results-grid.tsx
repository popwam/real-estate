import Link from "next/link";
import { ProjectCard } from "@/components/public/project-card";
import { tServer } from "@/i18n/server";
import type { PublicProject } from "@/lib/mock-public-marketplace";

type ProjectResultsGridProps = {
  projects: PublicProject[];
  locale?: string;
};

export function ProjectResultsGrid({ projects, locale }: ProjectResultsGridProps) {
  const t = (key: string) => tServer(locale, key);

  if (!projects.length) {
    return (
      <div className="ui-card border-dashed p-8 text-center sm:p-10">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {t("projects.empty.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
          {t("projects.empty.description")}
        </p>
        <Link href="/projects" className="ui-button ui-button-primary mt-6">
          {t("projects.empty.viewAll")}
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
