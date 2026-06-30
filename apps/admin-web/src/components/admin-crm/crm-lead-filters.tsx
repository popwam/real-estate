"use client";

import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import type { CrmLeadListQuery, CrmLeadStatus, PreferredContactMethod } from "@/types/admin-crm";

export function CrmLeadFilters({
  filters,
  onChange,
}: {
  filters: CrmLeadListQuery;
  onChange: (filters: CrmLeadListQuery) => void;
}) {
  const { t } = useI18n();

  function update(patch: Partial<CrmLeadListQuery>) {
    onChange({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <FilterLabel label={t("common.status")}>
        <select
          className="ui-input"
          value={filters.status ?? ""}
          onChange={(event) => update({ status: event.target.value as CrmLeadStatus | "" })}
        >
          <option value="">{t("filters.allStatuses")}</option>
          {["NEW", "CLAIMED", "IN_CONVERSATION", "QUALIFIED", "LOST", "CONVERTED", "SPAM"].map(
            (status) => (
              <option key={status} value={status}>
                {formatStatus(status, t)}
              </option>
            ),
          )}
        </select>
      </FilterLabel>
      <FilterLabel label={t("crm.leads.preferredContact")}>
        <select
          className="ui-input"
          value={filters.preferredContactMethod ?? ""}
          onChange={(event) =>
            update({ preferredContactMethod: event.target.value as PreferredContactMethod | "" })
          }
        >
          <option value="">{t("filters.allMethods")}</option>
          <option value="CALL">{t("contact.call")}</option>
          <option value="CHAT">{t("contact.chat")}</option>
          <option value="WHATSAPP">{t("contact.whatsapp")}</option>
        </select>
      </FilterLabel>
      <FilterLabel label={t("common.search")}>
        <Input
          value={filters.search ?? ""}
          onChange={(event) => update({ search: event.target.value })}
          placeholder={t("crm.leads.searchPlaceholder")}
        />
      </FilterLabel>
      <FilterLabel label={t("filters.createdFrom")}>
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(event) => update({ dateFrom: event.target.value })}
        />
      </FilterLabel>
      <FilterLabel label={t("filters.createdTo")}>
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(event) => update({ dateTo: event.target.value })}
        />
      </FilterLabel>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-h-10 items-center gap-2 text-sm text-[var(--color-foreground)]">
          <input
            className="accent-[var(--color-accent)]"
            type="checkbox"
            checked={Boolean(filters.claimedOnly)}
            onChange={(event) =>
              update({
                claimedOnly: event.target.checked,
                unclaimedOnly: event.target.checked ? false : filters.unclaimedOnly,
              })
            }
          />
          {t("crm.leads.claimed")}
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm text-[var(--color-foreground)]">
          <input
            className="accent-[var(--color-accent)]"
            type="checkbox"
            checked={Boolean(filters.unclaimedOnly)}
            onChange={(event) =>
              update({
                unclaimedOnly: event.target.checked,
                claimedOnly: event.target.checked ? false : filters.claimedOnly,
              })
            }
          />
          {t("crm.leads.unclaimed")}
        </label>
        <button
          type="button"
          className="ui-button ui-button-secondary"
          onClick={() => onChange({ page: 1, pageSize: filters.pageSize ?? 20 })}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("common.reset")}
        </button>
      </div>
    </div>
  );
}

function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
      {label}
      {children}
    </label>
  );
}

function formatStatus(value: string, t: (key: string) => string) {
  const key = `crm.leads.status.${value.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? value : translated;
}
