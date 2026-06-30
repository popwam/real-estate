"use client";

import { useI18n } from "@/i18n";
import type { PaginationMeta } from "@/types/admin-crm";

export function CrmPaginationControls({
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const { t, formatNumber } = useI18n();
  const totalPages = Math.max(1, pagination.totalPages || 1);

  return (
    <nav
      className="mt-5 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between"
      aria-label={t("pagination.resultsAria")}
    >
      <p>
        {t("pagination.page")}{" "}
        <strong className="text-[var(--color-foreground)]">{formatNumber(pagination.page)}</strong>{" "}
        {t("pagination.of")}{" "}
        <strong className="text-[var(--color-foreground)]">{formatNumber(totalPages)}</strong>
        {" · "}
        {t("pagination.total", { count: formatNumber(pagination.total) })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="crm-page-size">
          {t("pagination.resultsPerPage")}
        </label>
        <select
          id="crm-page-size"
          className="ui-input w-auto"
          value={pagination.pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {[10, 20, 50, 100].map((count) => (
            <option key={count} value={count}>
              {t("pagination.perPage", { count })}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ui-button ui-button-secondary"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        >
          {t("pagination.previous")}
        </button>
        <button
          type="button"
          className="ui-button ui-button-secondary"
          disabled={pagination.page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
        >
          {t("pagination.next")}
        </button>
      </div>
    </nav>
  );
}
