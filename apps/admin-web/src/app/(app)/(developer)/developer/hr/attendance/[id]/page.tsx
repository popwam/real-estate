"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";

export default function HrAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title="HR attendance detail"
      description="Attendance record detail. Payroll is not included."
      path={`/hr/attendance/${id}`}
      queryKey={`hr-attendance-${id}`}
      activityPath={`/operations/activities/HR/HrAttendanceRecord/${id}`}
      fields={[
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["PRESENT", "ABSENT", "LATE", "OFF"] },
        { name: "note", label: "Note" },
      ]}
    />
  );
}
