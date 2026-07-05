"use client";

import { useState } from "react";
import { CrmActivityFilters } from "@/components/admin-crm/crm-activity-filters";
import { CrmActivityTimeline } from "@/components/admin-crm/crm-activity-timeline";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCrmActivities } from "@/hooks/use-admin-crm";
import type { CrmActivityListQuery } from "@/types/admin-crm";
import { useI18n } from "@/i18n";

export function CrmActivitiesPageContent() {
  const { t } = useI18n();

  const [filters, setFilters] = useState<CrmActivityListQuery>({ page: 1, pageSize: 20 });
  const activities = useCrmActivities(filters);

  return (
    <>
      <PageHeader
        title={t("adminSweep.crm.activity.66256e79")}
        description="Scoped CRM activity timeline for lead and conversation events. Public token users cannot access this view."
      />
      <div className="space-y-6">
        <DetailCard title={t("adminSweep.filters.96e57821")}>
          <CrmActivityFilters filters={filters} onChange={setFilters} />
        </DetailCard>
        <DetailCard title={t("adminSweep.activity.timeline.3e53cf95")}>
          <CrmActivityTimeline
            activities={activities.data?.items}
            error={activities.error}
            isLoading={activities.isLoading}
            pagination={activities.data?.pagination}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            onPageSizeChange={(pageSize) => setFilters((current) => ({ ...current, page: 1, pageSize }))}
          />
        </DetailCard>
      </div>
    </>
  );
}
