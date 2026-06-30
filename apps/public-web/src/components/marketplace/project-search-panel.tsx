import Link from "next/link";
import { tServer } from "@/i18n/server";
import type { MarketplacePageFilters } from "@/lib/public-data";

type FilterOptions = {
  cities: string[];
  districts: string[];
  unitTypes: string[];
  priceRanges: Array<{ label: string; value: string }>;
};

type ProjectSearchPanelProps = {
  filters: MarketplacePageFilters;
  filterOptions: FilterOptions;
  resultCount: number;
  locale?: string;
};

export function ProjectSearchPanel({
  filters,
  filterOptions,
  resultCount,
  locale,
}: ProjectSearchPanelProps) {
  const t = (key: string, params?: Record<string, string | number>) => tServer(locale, key, params);

  return (
    <form className="ui-card grid gap-5 p-4 sm:p-5" aria-label={t("projects.filters.aria")}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
            {t("projects.filters.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            {t("projects.filters.description")}
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          {t("projects.filters.results", { count: resultCount })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <FilterSelect
          label={t("common.city")}
          name="city"
          value={filters.city ?? ""}
          emptyLabel={t("projects.filters.allCities")}
          options={filterOptions.cities}
        />
        <FilterSelect
          label={t("common.district")}
          name="district"
          value={filters.district ?? ""}
          emptyLabel={t("projects.filters.allDistricts")}
          options={filterOptions.districts}
        />
        <FilterSelect
          label={t("common.propertyType")}
          name="unitType"
          value={filters.unitType ?? ""}
          emptyLabel={t("projects.filters.allPropertyTypes")}
          options={filterOptions.unitTypes}
        />
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
          {t("common.price")}
          <select name="priceRange" defaultValue={filters.priceRange ?? ""} className="ui-input">
            {filterOptions.priceRanges.map((range) => (
              <option key={range.value || "any"} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="ui-button ui-button-primary">
          {t("projects.filters.apply")}
        </button>
        <Link href="/projects" className="ui-button ui-button-secondary">
          {t("common.reset")}
        </Link>
      </div>
    </form>
  );
}

function FilterSelect({
  label,
  name,
  value,
  emptyLabel,
  options,
}: {
  label: string;
  name: string;
  value: string;
  emptyLabel: string;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
      {label}
      <select name={name} defaultValue={value} className="ui-input">
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
