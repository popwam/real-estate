"use client";

import { CrmActivityItem } from "@/components/admin-crm/crm-activity-item";
import { CrmActivityPaginationControls } from "@/components/admin-crm/crm-activity-pagination-controls";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import type { CrmActivity, PaginationMeta } from "@/types/admin-crm";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();

  if (isLoading) {
    return <LoadingState label="Loading activity" />;
  }

  if (error) {
    return <FeedbackState tone="error" title={t("adminSweep.activity.could.not.be.loaded.dec85656")} description={error.message} />;
  }

  if (!activities?.length) {
    return <EmptyState title={t("adminSweep.no.activity.recorded.yet.e861e835")} description="Status changes, notes, tasks, and conversation events will appear here when available." />;
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
