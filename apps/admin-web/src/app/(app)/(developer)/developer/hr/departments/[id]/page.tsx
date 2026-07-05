"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";
import { useI18n } from "@/i18n";

export default function HrDepartmentDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title={t("adminSweep.hr.department.detail.6f31ce2a")}
      description="Department record detail."
      path={`/hr/departments/${id}`}
      queryKey={`hr-department-${id}`}
      activityPath={`/operations/activities/HR/HrDepartment/${id}`}
      fields={[{ name: "name", label: "Name" }]}
    />
  );
}
