"use client";

import type { PaginationMeta } from "@/types/admin-crm";

export function CrmPaginationControls({ pagination, onPageChange, onPageSizeChange }: { pagination: PaginationMeta; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void }) {
  const totalPages = Math.max(1, pagination.totalPages || 1);
  return (
    <nav className="mt-5 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between" aria-label="Results pagination">
      <p>Page <strong className="text-[var(--color-foreground)]">{pagination.page}</strong> of <strong className="text-[var(--color-foreground)]">{totalPages}</strong> · {pagination.total.toLocaleString()} total</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="crm-page-size">Results per page</label>
        <select id="crm-page-size" className="ui-input w-auto" value={pagination.pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}><option value={10}>10 per page</option><option value={20}>20 per page</option><option value={50}>50 per page</option><option value={100}>100 per page</option></select>
        <button type="button" className="ui-button ui-button-secondary" disabled={pagination.page <= 1} onClick={() => onPageChange(Math.max(1, pagination.page - 1))}>Previous</button>
        <button type="button" className="ui-button ui-button-secondary" disabled={pagination.page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}>Next</button>
      </div>
    </nav>
  );
}
