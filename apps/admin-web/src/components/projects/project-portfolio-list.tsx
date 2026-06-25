import Link from "next/link";
import { ArrowUpRight, Eye, MapPin, Package, Settings2 } from "lucide-react";
import { ProjectStatusBadge, ProjectVisibilityBadge } from "@/components/developer/badges";
import type { Project } from "@/types/developer";

export function ProjectPortfolioList({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {projects.map((project) => {
        const location = [project.city, project.district].filter(Boolean).join(", ");
        const units = project._count?.inventoryUnits;

        return (
          <article key={project.id} className="ui-card flex min-h-72 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                    {formatLabel(project.type)}
                  </p>
                  <h2 className="mt-2 truncate text-xl font-semibold text-[var(--color-foreground)]">
                    <Link href={`/developer/projects/${project.id}`} className="hover:text-[var(--color-accent)]">
                      {project.name}
                    </Link>
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {location || "Location not completed"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:max-w-52 sm:justify-end">
                  <ProjectStatusBadge status={project.status} />
                  <ProjectVisibilityBadge visibility={project.visibility} />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <PortfolioFact label="Inventory" value={typeof units === "number" ? `${units} units` : "Review units"} />
                <PortfolioFact label="Selling mode" value={formatLabel(project.sellingMode)} />
                <PortfolioFact label="Pricing" value="Unit level" />
              </div>

              <p className="mt-5 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                {project.description || "Add a clear project description to strengthen public readiness."}
              </p>
            </div>

            <div className="grid grid-cols-3 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <ProjectAction href={`/developer/projects/${project.id}`} label="Manage" icon={<Settings2 className="h-4 w-4" aria-hidden="true" />} />
              <ProjectAction href={`/developer/projects/${project.id}/inventory`} label="Inventory" icon={<Package className="h-4 w-4" aria-hidden="true" />} />
              <ProjectAction href={`/developer/projects/${project.id}/visibility`} label="Visibility" icon={<Eye className="h-4 w-4" aria-hidden="true" />} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PortfolioFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}

function ProjectAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-center gap-2 border-e border-[var(--color-border)] px-2 text-xs font-semibold text-[var(--color-foreground)] last:border-e-0 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent)] sm:text-sm"
      aria-label={`${label} project`}
    >
      {icon}
      {label}
      <ArrowUpRight className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
    </Link>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
