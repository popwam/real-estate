"use client";

import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import type { ConversationListQuery, ConversationStatus, ConversationType } from "@/types/admin-crm";

export function ConversationFilters({
  filters,
  onChange,
}: {
  filters: ConversationListQuery;
  onChange: (filters: ConversationListQuery) => void;
}) {
  const { t } = useI18n();

  function update(patch: Partial<ConversationListQuery>) {
    onChange({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <Filter label={t("common.status")}>
        <select
          className="ui-input"
          value={filters.status ?? ""}
          onChange={(event) => update({ status: event.target.value as ConversationStatus | "" })}
        >
          <option value="">{t("filters.allStatuses")}</option>
          <option value="OPEN">{t("status.open")}</option>
          <option value="CLOSED">{t("status.closed")}</option>
          <option value="ARCHIVED">{t("status.archived")}</option>
        </select>
      </Filter>
      <Filter label={t("common.type")}>
        <select
          className="ui-input"
          value={filters.type ?? ""}
          onChange={(event) => update({ type: event.target.value as ConversationType | "" })}
        >
          <option value="">{t("filters.allTypes")}</option>
          <option value="PUBLIC_LEAD">{t("conversation.type.publicLead")}</option>
          <option value="DEAL_ROOM">{t("conversation.type.dealRoom")}</option>
          <option value="SUPPORT">{t("conversation.type.support")}</option>
        </select>
      </Filter>
      <Filter label={t("common.search")}>
        <Input
          value={filters.search ?? ""}
          onChange={(event) => update({ search: event.target.value })}
          placeholder={t("conversation.filters.searchPlaceholder")}
        />
      </Filter>
      <Filter label={t("filters.updatedFrom")}>
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(event) => update({ dateFrom: event.target.value })}
        />
      </Filter>
      <Filter label={t("filters.updatedTo")}>
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(event) => update({ dateTo: event.target.value })}
        />
      </Filter>
      <div className="flex items-end">
        <button
          type="button"
          className="ui-button ui-button-secondary"
          onClick={() => onChange({ page: 1, pageSize: filters.pageSize ?? 20 })}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("filters.reset")}
        </button>
      </div>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
      {label}
      {children}
    </label>
  );
}
