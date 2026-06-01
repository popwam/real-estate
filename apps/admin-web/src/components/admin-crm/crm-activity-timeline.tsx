"use client";

import { CrmActivityItem } from "@/components/admin-crm/crm-activity-item";
import { CrmActivityPaginationControls } from "@/components/admin-crm/crm-activity-pagination-controls";
import { LoadingState } from "@/components/loading-state";
import type { CrmActivity, PaginationMeta } from "@/types/admin-crm";

export function CrmActivityTimeline({
  activities,
  error,
  isLoading,
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  activities?: CrmActivity[];
  error?: Error | null;
  isLoading?: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  if (isLoading) {
    return <LoadingState label="Loading activity" />;
  }

  if (error) {
    return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  }

  if (!activities?.length) {
    return <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No activity recorded yet.</p>;
  }

  return (
    <div>
      <ol className="space-y-3">
        {activities.map((activity) => (
          <CrmActivityItem key={activity.id} activity={activity} />
        ))}
      </ol>
      {pagination && onPageChange && onPageSizeChange ? (
        <CrmActivityPaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      ) : null}
    </div>
  );
}
