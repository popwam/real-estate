"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Search,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import {
  exportAttendanceCsvApi,
  getMonthlyAttendanceApi,
  type MonthlyAttendanceDay,
  saveMonthlyAttendanceDayApi,
} from "@/lib/hr-settings-api";
import { hasPermission } from "@/lib/permissions";

const EDITABLE_STATUSES = [
  "PRESENT",
  "LATE",
  "SEVERE_LATE",
  "ABSENT",
  "LEAVE",
  "OFF",
  "EARLY_LEAVE",
] as const;

export function TeamAttendanceSection({
  queryKey,
}: {
  queryKey: string;
  detailBasePath?: string;
}) {
  const { t } = useI18n();
  const session = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const timezone = session.data?.organization?.timezone || "UTC";
  const currentMonth = organizationDate(new Date(), timezone).slice(0, 7);
  const requestedMonth = searchParams.get("month");
  const selectedMonth = isMonthOnly(requestedMonth)
    ? requestedMonth
    : currentMonth;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MonthlyAttendanceDay | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const canExport = hasPermission(session.data, "hr.attendance.export");
  const canManage = hasPermission(session.data, "hr.attendance.manage");

  const attendance = useQuery({
    queryKey: ["attendance-monthly", queryKey, selectedMonth],
    queryFn: () => getMonthlyAttendanceApi(selectedMonth),
  });

  const save = useMutation({
    mutationFn: (input: {
      record: MonthlyAttendanceDay;
      status: string;
      checkInAt: string | null;
      checkOutAt: string | null;
      note: string | null;
    }) =>
      saveMonthlyAttendanceDayApi(input.record.id, {
        employeeId: input.record.employeeId,
        date: input.record.date,
        status: input.status,
        checkInAt: input.checkInAt,
        checkOutAt: input.checkOutAt,
        note: input.note,
      }),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({
        queryKey: ["attendance-monthly", queryKey],
      });
    },
  });

  const employees = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return attendance.data?.employees ?? [];
    return (attendance.data?.employees ?? []).filter((employee) =>
      `${employee.employeeName} ${employee.employeeCode ?? ""}`
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [attendance.data?.employees, search]);

  function setMonth(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    params.set("month", nextMonth);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function exportAttendance() {
    setExporting(true);
    setExportError(null);
    try {
      const csv = await exportAttendanceCsvApi(`${selectedMonth}-01`);
      const url = URL.createObjectURL(
        new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `attendance-${selectedMonth}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : t("attendance.admin.exportError"),
      );
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (!isMonthOnly(requestedMonth) || requestedMonth > currentMonth) {
      setMonth(currentMonth);
    }
    // Normalize the URL after the organization timezone becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedMonth, timezone]);

  const locale =
    typeof document === "undefined"
      ? "en"
      : document.documentElement.lang || "en";
  const monthTitle = formatMonth(selectedMonth, locale);

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-gradient-to-l from-emerald-50 via-white to-sky-50 p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                {t("attendance.monthly.title")}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-950">
                {monthTitle}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                {t("attendance.monthly.description")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="ui-button-secondary"
                onClick={() => setMonth(addMonths(selectedMonth, -1))}
              >
                <ChevronRight
                  className="h-4 w-4 rtl:hidden"
                  aria-hidden="true"
                />
                <ChevronLeft
                  className="hidden h-4 w-4 rtl:block"
                  aria-hidden="true"
                />
                {t("attendance.monthly.previous")}
              </Button>
              <Input
                aria-label={t("attendance.monthly.title")}
                className="w-auto bg-white"
                type="month"
                max={currentMonth}
                value={selectedMonth}
                onChange={(event) =>
                  isMonthOnly(event.target.value) &&
                  setMonth(event.target.value)
                }
              />
              <Button
                type="button"
                className="ui-button-secondary"
                onClick={() => setMonth(currentMonth)}
              >
                {t("attendance.monthly.current")}
              </Button>
              {canExport ? (
                <Button
                  type="button"
                  onClick={exportAttendance}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {exporting
                    ? t("attendance.admin.exporting")
                    : t("attendance.admin.export")}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="relative mt-4 max-w-md">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <Input
              className="bg-white ps-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("attendance.monthly.searchEmployee")}
            />
          </div>
          {exportError ? (
            <p className="mt-3 text-sm text-red-700">{exportError}</p>
          ) : null}
        </div>

        {attendance.isLoading ? (
          <LoadingState label={t("attendance.monthly.title")} />
        ) : attendance.isError ? (
          <p className="p-6 text-sm text-red-700">{attendance.error.message}</p>
        ) : employees.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            {t("attendance.monthly.noEmployees")}
          </p>
        ) : (
          <div className="max-h-[68vh] overflow-auto">
            <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-20 bg-zinc-900 text-white shadow-sm">
                <tr>
                  <th className="sticky start-0 z-30 min-w-56 border-e border-zinc-700 bg-zinc-900 px-4 py-3 text-start">
                    {t("attendance.admin.employee")}
                  </th>
                  {attendance.data?.days.map((date) => (
                    <th
                      key={date}
                      className="min-w-20 border-e border-zinc-700 px-2 py-2 text-center font-medium"
                    >
                      <span className="block text-[11px] text-zinc-300">
                        {formatWeekday(date, locale)}
                      </span>
                      <span className="mt-0.5 block text-base">
                        {Number(date.slice(-2))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, rowIndex) => (
                  <tr
                    key={employee.employeeId}
                    className={rowIndex % 2 ? "bg-zinc-50/70" : "bg-white"}
                  >
                    <th className="sticky start-0 z-10 border-b border-e border-zinc-200 bg-inherit px-4 py-3 text-start shadow-[2px_0_4px_-3px_rgba(0,0,0,.35)]">
                      <span className="block font-semibold text-zinc-900">
                        {employee.employeeName}
                      </span>
                      {employee.employeeCode ? (
                        <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                          {employee.employeeCode}
                        </span>
                      ) : null}
                    </th>
                    {employee.days.map((day) => (
                      <td
                        key={day.date}
                        className="border-b border-e border-zinc-200 p-1 text-center"
                      >
                        <button
                          type="button"
                          disabled={!canManage || day.status === "NOT_EMPLOYED"}
                          onClick={() => setEditing(day)}
                          className={`group min-h-14 w-full rounded-lg px-1.5 py-1 text-xs transition ${statusClass(day.status)} ${canManage && day.status !== "NOT_EMPLOYED" ? "cursor-pointer hover:ring-2 hover:ring-emerald-400" : "cursor-default"}`}
                          title={`${employee.employeeName} — ${day.date} — ${statusLabel(day.status, t)}`}
                        >
                          <span className="block font-semibold">
                            {statusLabel(day.status, t)}
                          </span>
                          {day.checkInAt ? (
                            <span className="mt-1 block font-mono text-[10px]">
                              {formatTime(day.checkInAt, timezone)}
                            </span>
                          ) : null}
                          {canManage && day.status !== "NOT_EMPLOYED" ? (
                            <Pencil
                              className="mx-auto mt-1 hidden h-3 w-3 group-hover:block"
                              aria-hidden="true"
                            />
                          ) : null}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing ? (
        <AttendanceEditDialog
          record={editing}
          timezone={timezone}
          saving={save.isPending}
          error={save.error instanceof Error ? save.error.message : null}
          onClose={() => setEditing(null)}
          onSave={(input) => save.mutate({ record: editing, ...input })}
          t={t}
        />
      ) : null}
    </section>
  );
}

function AttendanceEditDialog({
  record,
  timezone,
  saving,
  error,
  onClose,
  onSave,
  t,
}: {
  record: MonthlyAttendanceDay;
  timezone: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: {
    status: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    note: string | null;
  }) => void;
  t: (key: string) => string;
}) {
  const [status, setStatus] = useState(
    EDITABLE_STATUSES.includes(
      record.status as (typeof EDITABLE_STATUSES)[number],
    )
      ? record.status
      : "PRESENT",
  );
  const [checkInAt, setCheckInAt] = useState(
    toLocalInput(record.checkInAt, timezone),
  );
  const [checkOutAt, setCheckOutAt] = useState(
    toLocalInput(record.checkOutAt, timezone),
  );
  const [note, setNote] = useState(record.note ?? "");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-edit-title"
    >
      <form
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            status,
            checkInAt: checkInAt ? zonedLocalToIso(checkInAt, timezone) : null,
            checkOutAt: checkOutAt
              ? zonedLocalToIso(checkOutAt, timezone)
              : null,
            note: note.trim() || null,
          });
        }}
      >
        <h3
          id="attendance-edit-title"
          className="text-xl font-bold text-zinc-950"
        >
          {t("attendance.monthly.editDay")}
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          {record.employeeName} · {record.date}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Label className="sm:col-span-2">
            {t("attendance.admin.status")}
            <select
              className="ui-input mt-1 w-full"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {EDITABLE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {statusLabel(option, t)}
                </option>
              ))}
            </select>
          </Label>
          <Label>
            {t("attendance.admin.checkInAt")}
            <Input
              className="mt-1"
              type="datetime-local"
              value={checkInAt}
              onChange={(event) => setCheckInAt(event.target.value)}
            />
          </Label>
          <Label>
            {t("attendance.admin.checkOutAt")}
            <Input
              className="mt-1"
              type="datetime-local"
              value={checkOutAt}
              onChange={(event) => setCheckOutAt(event.target.value)}
            />
          </Label>
          <Label className="sm:col-span-2">
            {t("attendance.admin.note")}
            <Textarea
              className="mt-1"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            className="ui-button-secondary"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function statusLabel(status: string, t: (key: string) => string) {
  return t(`attendance.monthly.status.${status}`);
}

function statusClass(status: string) {
  if (status === "PRESENT") return "bg-emerald-100 text-emerald-900";
  if (status === "LATE" || status === "SEVERE_LATE" || status === "EARLY_LEAVE")
    return "bg-amber-100 text-amber-900";
  if (status === "ABSENT") return "bg-red-100 text-red-900";
  if (status === "LEAVE") return "bg-sky-100 text-sky-900";
  if (status === "OFF") return "bg-violet-100 text-violet-900";
  if (status === "NOT_EMPLOYED") return "bg-zinc-100 text-zinc-400";
  return "bg-white text-zinc-500 ring-1 ring-inset ring-zinc-200";
}

function formatMonth(month: string, locale: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

function formatWeekday(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatTime(value: string, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function toLocalInput(value: string | null, timezone: string) {
  if (!value) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(value));
    const part = (type: string) =>
      parts.find((item) => item.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
  } catch {
    return "";
  }
}

function zonedLocalToIso(value: string, timezone: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  let instant = Date.UTC(year, month - 1, day, hour, minute);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const shown = toLocalInput(new Date(instant).toISOString(), timezone);
    const shownAsUtc = Date.parse(`${shown}:00Z`);
    const wantedAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    instant += wantedAsUtc - shownAsUtc;
  }
  return new Date(instant).toISOString();
}

export function organizationDate(value: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const part = (type: string) =>
      parts.find((item) => item.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}`;
  } catch {
    return organizationDate(value, "UTC");
  }
}

export function isMonthOnly(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

export function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return next.toISOString().slice(0, 7);
}

export function isDateOnly(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addDays(date: string, amount: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount))
    .toISOString()
    .slice(0, 10);
}
