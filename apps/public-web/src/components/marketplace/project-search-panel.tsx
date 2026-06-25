import Link from "next/link";
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
};

export function ProjectSearchPanel({
  filters,
  filterOptions,
  resultCount,
}: ProjectSearchPanelProps) {
  return (
    <form className="ui-card grid gap-5 p-4 sm:p-5" aria-label="Project filters">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
            Search projects
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            Use available public facts to narrow the current collection.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <FilterSelect
          label="City"
          name="city"
          value={filters.city ?? ""}
          emptyLabel="All cities"
          options={filterOptions.cities}
        />
        <FilterSelect
          label="District"
          name="district"
          value={filters.district ?? ""}
          emptyLabel="All districts"
          options={filterOptions.districts}
        />
        <FilterSelect
          label="Property type"
          name="unitType"
          value={filters.unitType ?? ""}
          emptyLabel="All property types"
          options={filterOptions.unitTypes}
        />
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
          Price
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
          Apply filters
        </button>
        <Link href="/projects" className="ui-button ui-button-secondary">
          Reset
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
