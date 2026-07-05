"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";
import { useI18n } from "@/i18n";

export default function HrEmployeeDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title={t("adminSweep.hr.employee.detail.4134c33a")}
      description="Safe employee record detail. Payroll is not included."
      path={`/hr/employees/${id}`}
      queryKey={`hr-employee-${id}`}
      activityPath={`/operations/activities/HR/HrEmployee/${id}`}
      fields={[
        { name: "name", label: "Name" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Phone" },
        { name: "roleTitle", label: "Role title" },
        { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"] },
      ]}
    />
  );
}
