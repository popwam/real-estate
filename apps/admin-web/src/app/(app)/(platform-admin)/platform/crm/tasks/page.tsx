"use client";

import { CrmTasksPage } from "@/components/admin-operations/crm-tasks-page";
import { useI18n } from "@/i18n";

export default function PlatformCrmTasksPage() {
  const { t } = useI18n();

  return <CrmTasksPage title={t("adminSweep.crm.tasks.7ce8c1a2")} description="Platform-scoped CRM follow-up task foundation." />;
}
