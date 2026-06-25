"use client";

import Link from "next/link";
import { FolderKanban, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectPortfolioList } from "@/components/projects/project-portfolio-list";
import { useProjects } from "@/hooks/use-developer";

const initialFilters: Record<string, string | undefined> = {};

export default function DeveloperProjectsPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>(initialFilters);
  const { data = [], isLoading, error } = useProjects(filters);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project portfolio"
        description="Control project readiness, inventory, visibility, payment plans, and selling access from one portfolio."
        actions={
          <Link href="/developer/projects/new" className="ui-button ui-button-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New project
          </Link>
        }
      />

      <section className="ui-card p-4 sm:p-5" aria-labelledby="project-filters-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="project-filters-title" className="text-sm font-semibold text-[var(--color-foreground)]">Find a project</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">Filter the current developer portfolio by lifecycle, audience, or location.</p>
          </div>
          {hasFilters ? (
            <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label="Project status" value={filters.status ?? ""} onChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))} options={["DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"]} />
          <FilterSelect label="Visibility" value={filters.visibility ?? ""} onChange={(value) => setFilters((current) => ({ ...current, visibility: value || undefined }))} options={["PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"]} />
          <FilterInput label="City" value={filters.city ?? ""} onChange={(value) => setFilters((current) => ({ ...current, city: value || undefined }))} />
          <FilterInput label="District" value={filters.district ?? ""} onChange={(value) => setFilters((current) => ({ ...current, district: value || undefined }))} />
        </div>
      </section>

      {isLoading ? <LoadingState label="Loading project portfolio" /> : null}
      {error ? <FeedbackState tone="error" title="Projects could not be loaded" description={error.message} /> : null}
      {!isLoading && !error ? (
        <section aria-labelledby="portfolio-results-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="portfolio-results-title" className="text-sm font-semibold text-[var(--color-foreground)]">
              {data.length.toLocaleString()} {data.length === 1 ? "project" : "projects"}
            </h2>
            <p className="text-xs text-[var(--color-muted)]">Pricing is managed at unit level.</p>
          </div>
          {data.length ? (
            <ProjectPortfolioList projects={data} />
          ) : (
            <EmptyState
              icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
              title={hasFilters ? "No projects match these filters" : "Create your first project"}
              description={hasFilters ? "Clear or adjust the filters to return to the full portfolio." : "Start with the project identity and location, then add inventory, visibility, and selling permissions."}
              action={hasFilters ? (
                <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}>Clear filters</button>
              ) : (
                <Link href="/developer/projects/new" className="ui-button ui-button-primary"><Plus className="h-4 w-4" aria-hidden="true" />Create first project</Link>
              )}
            />
          )}
        </section>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
      {label}
      <select className="ui-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
      </select>
    </label>
  );
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
      {label}
      <input className="ui-input" placeholder={`Filter by ${label.toLowerCase()}`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
