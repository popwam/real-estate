import Link from "next/link";
import { ProjectCard } from "@/components/public/project-card";
import {
  listProjectFilterOptions,
  listPublicProjectsByFilters,
} from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Projects",
  description:
    "Browse public POPWAM project listings filtered to open-marketplace records only.",
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
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Project marketplace
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">
            Public projects
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Listings come from the Stage 2 public API in API mode, with mock
            fallback available for local demos.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <form className="grid gap-4 rounded border border-slate-200 bg-white p-5 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            City
            <select
              name="city"
              defaultValue={filters.city ?? ""}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950"
            >
              <option value="">All cities</option>
              {filterOptions.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            District
            <select
              name="district"
              defaultValue={filters.district ?? ""}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950"
            >
              <option value="">All districts</option>
              {filterOptions.districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Unit type
            <select
              name="unitType"
              defaultValue={filters.unitType ?? ""}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950"
            >
              <option value="">All unit types</option>
              {filterOptions.unitTypes.map((unitType) => (
                <option key={unitType} value={unitType}>
                  {unitType}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Price range
            <select
              name="priceRange"
              defaultValue={filters.priceRange ?? ""}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-950"
            >
              {filterOptions.priceRanges.map((range) => (
                <option key={range.value || "any"} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3 md:col-span-4">
            <button
              type="submit"
              className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
            <Link
              href="/projects"
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Reset
            </Link>
          </div>
        </form>

        {projects.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-2xl font-semibold text-slate-950">
              No public projects match these filters
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Try broadening the city, district, unit type, or price range. The
              current results are public-only and hide private inventory.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

