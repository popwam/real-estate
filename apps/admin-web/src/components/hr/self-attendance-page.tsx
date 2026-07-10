"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, LogIn, LogOut, MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import {
  checkInApi,
  checkOutApi,
  getAttendanceSettingsApi,
  getMyAttendanceHistoryApi,
  getMyAttendanceTodayApi,
  listBranchesApi,
} from "@/lib/hr-settings-api";

type LocationPayload = {
  latitude?: number;
  longitude?: number;
};

export function SelfAttendancePage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [branchId, setBranchId] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const today = useQuery({ queryKey: ["hr-attendance", "me", "today"], queryFn: getMyAttendanceTodayApi });
  const history = useQuery({ queryKey: ["hr-attendance", "me", "history"], queryFn: getMyAttendanceHistoryApi });
  const branches = useQuery({ queryKey: ["hr-branches", "self"], queryFn: listBranchesApi });
  const settings = useQuery({ queryKey: ["hr-attendance-settings", "self"], queryFn: getAttendanceSettingsApi });
  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["hr-attendance", "me", "today"] }),
      qc.invalidateQueries({ queryKey: ["hr-attendance", "me", "history"] }),
    ]);
  };
  const checkIn = useMutation({
    mutationFn: async () => {
      setLocationError(null);
      const location = await getBrowserLocation(
        settings.data?.requireLocation ?? true,
        t("attendance.self.locationUnavailable"),
        t("attendance.self.locationRequired"),
      ).catch((error: Error) => {
        setLocationError(error.message);
        return {};
      });
      return checkInApi({ ...location, branchId: branchId || undefined });
    },
    onSuccess: invalidate,
  });
  const checkOut = useMutation({
    mutationFn: async () => {
      const location = await getBrowserLocation(false, t("attendance.self.locationUnavailable"), t("attendance.self.locationRequired")).catch(() => ({}));
      return checkOutApi({ ...location, branchId: branchId || undefined });
    },
    onSuccess: invalidate,
  });
  const record = today.data;

  return (
    <div className="space-y-5">
      <PageHeader title={t("attendance.self.title")} description={t("attendance.self.description")} />
      <DetailCard title={t("attendance.self.today")}>
        {today.isLoading ? <LoadingState label={t("attendance.self.loadingToday")} /> : null}
        {record ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={<Clock className="h-4 w-4" />} label={t("attendance.self.checkIn")} value={formatDateTime(record.checkInAt)} />
            <Metric icon={<Clock className="h-4 w-4" />} label={t("attendance.self.checkOut")} value={formatDateTime(record.checkOutAt)} />
            <Metric icon={<MapPin className="h-4 w-4" />} label={t("attendance.self.status")} value={record.status ?? t("common.notSet")} />
          </div>
        ) : null}
        {settings.data ? (
          <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
            {t("companySettings.browserWifiLimitation")}
          </p>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="attendanceBranch">{t("attendance.self.branch")}</Label>
            <select
              id="attendanceBranch"
              className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
            >
              <option value="">{t("attendance.self.noBranch")}</option>
              {branches.data?.filter((branch) => branch.isActive).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={() => checkIn.mutate()} disabled={!record?.canCheckIn || checkIn.isPending}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {checkIn.isPending ? t("common.saving") : t("attendance.self.checkInAction")}
          </Button>
          <Button type="button" className="ui-button-secondary" onClick={() => checkOut.mutate()} disabled={!record?.canCheckOut || checkOut.isPending}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {checkOut.isPending ? t("common.saving") : t("attendance.self.checkOutAction")}
          </Button>
        </div>
        {record?.minutesLate ? (
          <FeedbackState
            className="mt-4"
            tone="success"
            title={t("attendance.self.latePenalty")}
            description={t("attendance.self.latePenaltyDescription", {
              minutes: record.minutesLate,
              penalty: record.penaltyType ?? t("common.notSet"),
            })}
          />
        ) : null}
        {locationError ? <FeedbackState className="mt-4" tone="error" title={t("attendance.self.locationError")} description={locationError} /> : null}
        {checkIn.error ? <FeedbackState className="mt-4" tone="error" title={t("attendance.self.checkInError")} description={checkIn.error.message} /> : null}
        {checkOut.error ? <FeedbackState className="mt-4" tone="error" title={t("attendance.self.checkOutError")} description={checkOut.error.message} /> : null}
      </DetailCard>

      <DetailCard title={t("attendance.self.history")}>
        {history.isLoading ? <LoadingState label={t("attendance.self.loadingHistory")} /> : null}
        {history.data?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2">{t("attendance.self.date")}</th>
                  <th className="px-3 py-2">{t("attendance.self.checkIn")}</th>
                  <th className="px-3 py-2">{t("attendance.self.checkOut")}</th>
                  <th className="px-3 py-2">{t("attendance.self.status")}</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((row) => (
                  <tr key={row.id ?? row.date} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">{formatDate(row.date)}</td>
                    <td className="px-3 py-2">{formatDateTime(row.checkInAt)}</td>
                    <td className="px-3 py-2">{formatDateTime(row.checkOutAt)}</td>
                    <td className="px-3 py-2">{row.status ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">{t("attendance.self.emptyHistory")}</p>
        )}
      </DetailCard>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}

async function getBrowserLocation(required: boolean, unavailableMessage: string, requiredMessage: string): Promise<LocationPayload> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    if (required) throw new Error(unavailableMessage);
    return {};
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => (required ? reject(new Error(requiredMessage)) : resolve({})),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
