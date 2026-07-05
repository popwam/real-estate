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
import { useI18n } from "@/i18n";

const initialFilters: Record<string, string | undefined> = {};

export default function DeveloperProjectsPage() {
  const { t } = useI18n();
  const [filters, setFilters] = useState<Record<string, string | undefined>>(initialFilters);
  const { data = [], isLoading, error } = useProjects(filters);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("developerProjects.title")}
        description={t("developerProjects.description")}
        actions={
          <Link href="/developer/projects/new" className="ui-button ui-button-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("developerProjects.newProject")}
          </Link>
        }
      />

      <section className="ui-card p-4 sm:p-5" aria-labelledby="project-filters-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="project-filters-title" className="text-sm font-semibold text-[var(--color-foreground)]">{t("developerProjects.findProject")}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{t("developerProjects.filterDescription")}</p>
          </div>
          {hasFilters ? (
            <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("common.clearFilters")}
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label={t("developerProjects.projectStatus")} allLabel={t("common.all")} value={filters.status ?? ""} onChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))} options={["DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"]} optionLabel={(option) => t(`projectStatus.${option}`)} />
          <FilterSelect label={t("common.visibility")} allLabel={t("common.all")} value={filters.visibility ?? ""} onChange={(value) => setFilters((current) => ({ ...current, visibility: value || undefined }))} options={["PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"]} optionLabel={(option) => t(`projectVisibility.${option}`)} />
          <FilterInput label={t("common.city")} placeholder={t("developerProjects.filterByCity")} value={filters.city ?? ""} onChange={(value) => setFilters((current) => ({ ...current, city: value || undefined }))} />
          <FilterInput label={t("common.district")} placeholder={t("developerProjects.filterByDistrict")} value={filters.district ?? ""} onChange={(value) => setFilters((current) => ({ ...current, district: value || undefined }))} />
        </div>
      </section>

      {isLoading ? <LoadingState label={t("developerProjects.loading")} /> : null}
      {error ? <FeedbackState tone="error" title={t("developerProjects.loadError")} description={error.message} /> : null}
      {!isLoading && !error ? (
        <section aria-labelledby="portfolio-results-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="portfolio-results-title" className="text-sm font-semibold text-[var(--color-foreground)]">
              {data.length.toLocaleString()} {data.length === 1 ? t("developerProjects.projectSingular") : t("developerProjects.projectPlural")}
            </h2>
            <p className="text-xs text-[var(--color-muted)]">{t("developerProjects.pricingNote")}</p>
          </div>
          {data.length ? (
            <ProjectPortfolioList projects={data} />
          ) : (
            <EmptyState
              icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
              title={hasFilters ? t("developerProjects.noMatches") : t("developerProjects.createFirst")}
              description={hasFilters ? t("developerProjects.noMatchesDescription") : t("developerProjects.createFirstDescription")}
              action={hasFilters ? (
                <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}>{t("common.clearFilters")}</button>
              ) : (
                <Link href="/developer/projects/new" className="ui-button ui-button-primary"><Plus className="h-4 w-4" aria-hidden="true" />{t("developerProjects.createFirstAction")}</Link>
              )}
            />
          )}
        </section>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, allLabel, value, onChange, options, optionLabel }: { label: string; allLabel: string; value: string; onChange: (value: string) => void; options: string[]; optionLabel: (value: string) => string }) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
      {label}
      <select className="ui-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => <option key={option} value={option}>{optionLabel(option)}</option>)}
      </select>
    </label>
  );
}

function FilterInput({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
      {label}
      <input className="ui-input" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
