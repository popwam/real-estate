"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperHrDepartmentsPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.hr.departments.cbd4b154")}
      description="Internal department registry foundation."
      listPath="/hr/departments"
      queryKey="hr-departments"
      fields={[{ name: "name", label: "Name" }]}
      columns={["name", "isActive", "createdAt"]}
      detailBasePath="/developer/hr/departments"
    />
  );
}
