"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";
import { useI18n } from "@/i18n";

export default function HrAttendanceDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title={t("adminSweep.hr.attendance.detail.e3c35354")}
      description={t("attendance.admin.detailDescription")}
      path={`/hr/attendance/${id}`}
      queryKey={`hr-attendance-${id}`}
      activityPath={`/operations/activities/HR/HrAttendanceRecord/${id}`}
      fields={[
        { name: "date", label: t("attendance.admin.date"), type: "date" },
        { name: "checkInAt", label: t("attendance.admin.checkInAt"), type: "datetime-local" },
        { name: "checkOutAt", label: t("attendance.admin.checkOutAt"), type: "datetime-local" },
        { name: "status", label: t("attendance.admin.status"), type: "select", options: ["PRESENT", "ABSENT", "LATE", "OFF"] },
        { name: "verificationStatus", label: t("attendance.admin.verificationStatus"), type: "select", options: ["VERIFIED", "PENDING_REVIEW", "REJECTED", "FAILED"] },
        { name: "dvrVerificationStatus", label: t("attendance.admin.dvrStatus"), type: "select", options: ["NOT_REQUIRED", "PENDING", "MATCHED", "NOT_MATCHED", "MANUAL_REVIEW", "UNAVAILABLE"] },
        { name: "dvrReferenceId", label: t("attendance.admin.dvrReference") },
        { name: "checkInPhotoFileId", label: t("attendance.admin.checkInPhotoFileId") },
        { name: "checkOutPhotoFileId", label: t("attendance.admin.checkOutPhotoFileId") },
        { name: "note", label: t("attendance.admin.note") },
      ]}
    />
  );
}
