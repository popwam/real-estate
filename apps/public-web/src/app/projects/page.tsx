import { ProjectResultsGrid } from "@/components/marketplace/project-results-grid";
import { ProjectSearchPanel } from "@/components/marketplace/project-search-panel";
import {
  listProjectFilterOptions,
  listPublicProjectsByFilters,
} from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Projects",
  description:
    "Browse public real estate projects by location, property type, and available pricing filters.",
  path: "/projects",
});

type ProjectsPageProps = {
  searchParams?: Promise<{
    city?: string;
    district?: string;
    unitType?: string;
    priceRange?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const filters = (await searchParams) ?? {};
  const [projects, filterOptions] = await Promise.all([
    listPublicProjectsByFilters(filters),
    listProjectFilterOptions(),
  ]);

  return (
    <div className="bg-[var(--color-background)]">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Project marketplace
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">
            Browse public projects
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            Search the current public collection by location, property type, and
            pricing filters when those facts are available.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:items-start">
        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+1rem)]">
          <ProjectSearchPanel
            filters={filters}
            filterOptions={filterOptions}
            resultCount={projects.length}
          />
        </div>
        <ProjectResultsGrid projects={projects} />
      </section>
    </div>
  );
}
