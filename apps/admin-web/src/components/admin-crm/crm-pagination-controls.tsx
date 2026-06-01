"use client";

import { Button } from "@/components/ui/button";
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
  const totalPages = Math.max(1, pagination.totalPages || 1);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
      <div>
        Page <span className="font-medium text-zinc-950">{pagination.page}</span> of{" "}
        <span className="font-medium text-zinc-950">{totalPages}</span>
        <span className="ml-2 text-zinc-500">({pagination.total} total)</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm"
          value={pagination.pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <Button
          className="bg-white text-zinc-950 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        >
          Previous
        </Button>
        <Button
          className="bg-white text-zinc-950 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
          disabled={pagination.page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
