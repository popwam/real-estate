"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OperationsPage } from "@/components/admin-operations/operations-page";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";

export function TeamAttendanceSection({ queryKey, detailBasePath }: { queryKey: string; detailBasePath?: string }) {
  const { t } = useI18n();
  const session = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timezone = session.data?.organization?.timezone || "UTC";
  const today = organizationDate(new Date(), timezone);
  const requestedDate = searchParams.get("date");
  const selectedDate = isDateOnly(requestedDate) ? requestedDate : today;

  function setDate(nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDate);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (!isDateOnly(requestedDate)) setDate(today);
  // The invalid/missing URL is normalized once after the organization timezone loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedDate, timezone]);

  return <OperationsPage
    showHeader={false}
    title={t("adminSweep.hr.attendance.c2fcb0b7")}
    description={t("attendance.admin.description")}
    listPath={`/hr/attendance?date=${encodeURIComponent(selectedDate)}`}
    queryKey={`${queryKey}:date:${selectedDate}`}
    filterPrefix={<label className="grid gap-1 text-sm"><span className="font-medium text-zinc-700">{t("attendance.admin.date")}</span><div className="flex flex-wrap items-center gap-2"><InputDate value={selectedDate} onChange={(value) => isDateOnly(value) && setDate(value)} /><Button type="button" className="ui-button-secondary" onClick={() => setDate(addDays(selectedDate, -1))}>{t("attendance.admin.previousDay")}</Button><Button type="button" className="ui-button-secondary" onClick={() => setDate(today)}>{t("attendance.admin.today")}</Button><Button type="button" className="ui-button-secondary" onClick={() => setDate(addDays(selectedDate, 1))}>{t("attendance.admin.nextDay")}</Button></div></label>}
    emptyMessage={t("attendance.admin.emptyForDate")}
    fields={[
      { name: "employeeId", label: t("attendance.admin.employeeId") },
      { name: "date", label: t("attendance.admin.date"), type: "date" },
      { name: "checkInAt", label: t("attendance.admin.checkInAt"), type: "datetime-local" },
      { name: "checkOutAt", label: t("attendance.admin.checkOutAt"), type: "datetime-local" },
      { name: "status", label: t("attendance.admin.status"), type: "select", options: ["PRESENT", "ABSENT", "LATE", "SEVERE_LATE", "OFF", "EARLY_LEAVE"] },
      { name: "verificationStatus", label: t("attendance.admin.verificationStatus"), type: "select", options: ["VERIFIED", "PENDING_REVIEW", "REJECTED", "FAILED"] },
      { name: "faceVerificationStatus", label: t("attendance.admin.faceStatus"), type: "select", options: ["NOT_REQUIRED", "PENDING", "MATCHED", "NOT_MATCHED", "MANUAL_REVIEW_REQUIRED", "APPROVED_MANUALLY", "REJECTED"] },
      { name: "faceVerificationConfidence", label: t("attendance.admin.faceConfidence"), type: "number" },
      { name: "dvrVerificationStatus", label: t("attendance.admin.dvrStatus"), type: "select", options: ["NOT_REQUIRED", "PENDING", "MATCHED", "NOT_MATCHED", "MANUAL_REVIEW", "UNAVAILABLE"] },
      { name: "dvrReferenceId", label: t("attendance.admin.dvrReference") },
      { name: "note", label: t("attendance.admin.note") },
    ]}
    columns={[
      { name: "employee", label: t("attendance.admin.employee"), render: (row) => employeeName(row) },
      { name: "date", label: t("attendance.admin.date"), render: (row) => formatDate(row.date) },
      { name: "checkInAt", label: t("attendance.admin.checkInAt"), render: (row) => formatDateTime(row.checkInAt) },
      { name: "plannedCheckInAt", label: "Planned check-in", render: (row) => formatDateTime(row.plannedCheckInAt) },
      { name: "minutesLate", label: "Late by", render: (row) => row.minutesLate == null ? "-" : `${row.minutesLate} min` },
      { name: "checkOutAt", label: t("attendance.admin.checkOutAt"), render: (row) => formatDateTime(row.checkOutAt) },
      { name: "status", label: t("attendance.admin.status") },
      { name: "attendanceStatusAtCheckIn", label: "Check-in status", render: (row) => String(row.attendanceStatusAtCheckIn ?? row.status ?? "-") },
      { name: "scheduleSource", label: "Schedule source", render: (row) => String(row.scheduleSource ?? "-") },
      { name: "scheduleTimezone", label: "Schedule timezone", render: (row) => String(row.scheduleTimezone ?? "-") },
      { name: "lateUntilAt", label: "Late threshold", render: (row) => formatDateTime(row.lateUntilAt) },
      { name: "severeLateUntilAt", label: "Severe late threshold", render: (row) => formatDateTime(row.severeLateUntilAt) },
      { name: "absentAfterAt", label: "Absent threshold", render: (row) => formatDateTime(row.absentAfterAt) },
      { name: "verificationStatus", label: t("attendance.admin.verificationStatus") },
      { name: "faceVerificationStatus", label: t("attendance.admin.faceStatus") },
      { name: "referenceImageId", label: t("attendance.admin.referenceImage") },
      { name: "capturedImageId", label: t("attendance.admin.capturedImage") },
      { name: "verificationFailureReasons", label: t("attendance.admin.failureReasons"), render: (row) => formatReasons(row.verificationFailureReasons) },
      { name: "dvrVerificationStatus", label: t("attendance.admin.dvrStatus") },
      { name: "attendanceSource", label: t("attendance.admin.source") },
    ]}
    detailBasePath={detailBasePath}
  />;
}

function InputDate({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <input aria-label="Attendance date" className="h-10 rounded-md border border-zinc-300 px-3" type="date" value={value} onChange={(event) => onChange(event.target.value)} />; }

export function organizationDate(value: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}`;
  } catch { return organizationDate(value, "UTC"); }
}

export function isDateOnly(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function addDays(date: string, amount: number) { const [year, month, day] = date.split("-").map(Number); const next = new Date(Date.UTC(year, month - 1, day + amount)); return next.toISOString().slice(0, 10); }

function formatReasons(value: unknown) { return Array.isArray(value) && value.length ? value.map(String).join(", ") : "-"; }
function employeeName(row: Record<string, unknown>) { const employee = row.employee; if (employee && typeof employee === "object" && "name" in employee) { const name = (employee as { name?: unknown }).name; if (typeof name === "string" && name.trim()) return name; } return String(row.employeeId ?? "-"); }
function formatDate(value: unknown) { if (!value) return "-"; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(); }
function formatDateTime(value: unknown) { if (!value) return "-"; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(); }
