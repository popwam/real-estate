"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";

export default function HrDepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title="HR department detail"
      description="Department record detail."
      path={`/hr/departments/${id}`}
      queryKey={`hr-department-${id}`}
      activityPath={`/operations/activities/HR/HrDepartment/${id}`}
      fields={[{ name: "name", label: "Name" }]}
    />
  );
}
