"use client";

import { CrmPaginationControls } from "@/components/admin-crm/crm-pagination-controls";
import type { PaginationMeta } from "@/types/admin-crm";

export function CrmActivityPaginationControls({
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <CrmPaginationControls
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
