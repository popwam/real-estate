"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import {
  getAttendanceSettingsApi,
  listBranchesApi,
  saveBranchApi,
  setBranchActiveApi,
  updateAttendanceSettingsApi,
  type AttendanceSettings,
  type OrganizationBranch,
} from "@/lib/hr-settings-api";

export function CompanyHrSettings() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const branches = useQuery({ queryKey: ["hr-branches"], queryFn: listBranchesApi });
  const settings = useQuery({ queryKey: ["hr-attendance-settings"], queryFn: getAttendanceSettingsApi });
  const saveBranch = useMutation({
    mutationFn: saveBranchApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-branches"] }),
  });
  const activeBranch = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setBranchActiveApi(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-branches"] }),
  });
  const saveSettings = useMutation({
    mutationFn: updateAttendanceSettingsApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-attendance-settings"] }),
  });

  return (
    <div className="space-y-5">
      <DetailCard title={t("companySettings.branches")}>
        <BranchForm isPending={saveBranch.isPending} onSubmit={(input) => saveBranch.mutateAsync(input)} />
        {branches.isLoading ? <LoadingState label={t("companySettings.loadingBranches")} /> : null}
        {branches.data?.length ? (
          <div className="mt-5 grid gap-3">
            {branches.data.map((branch) => (
              <div key={branch.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">{branch.name}</p>
                    <p className="text-[var(--color-muted)]">{[branch.city, branch.country].filter(Boolean).join(", ") || t("common.notSet")}</p>
                  </div>
                  <Button className="ui-button-secondary" onClick={() => activeBranch.mutate({ id: branch.id, active: !branch.isActive })}>
                    {branch.isActive ? t("employeeAccess.deactivate") : t("employeeAccess.activate")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {saveBranch.error ? <FeedbackState className="mt-4" tone="error" title={t("companySettings.branchSaveError")} description={saveBranch.error.message} /> : null}
      </DetailCard>

      <DetailCard title={t("companySettings.attendancePolicy")}>
        {settings.isLoading ? <LoadingState label={t("companySettings.loadingAttendancePolicy")} /> : null}
        {settings.data ? (
          <AttendanceSettingsForm settings={settings.data} isPending={saveSettings.isPending} onSubmit={(input) => saveSettings.mutateAsync(input)} />
        ) : null}
        {saveSettings.error ? <FeedbackState className="mt-4" tone="error" title={t("companySettings.attendanceSaveError")} description={saveSettings.error.message} /> : null}
      </DetailCard>
    </div>
  );
}

function BranchForm({ isPending, onSubmit }: { isPending: boolean; onSubmit: (input: Partial<OrganizationBranch>) => Promise<unknown> }) {
  const { t } = useI18n();
  const [branch, setBranch] = useState<Partial<OrganizationBranch>>({ name: "", exactRadiusMeters: 30, expandedRadiusMeters: 1000 });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(branch);
    setBranch({ name: "", exactRadiusMeters: 30, expandedRadiusMeters: 1000 });
  }

  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
      <Field id="branchName" label={t("companySettings.branchName")}><Input id="branchName" value={branch.name ?? ""} onChange={(event) => setBranch((current) => ({ ...current, name: event.target.value }))} required /></Field>
      <Field id="branchCity" label={t("companySettings.city")}><Input id="branchCity" value={branch.city ?? ""} onChange={(event) => setBranch((current) => ({ ...current, city: event.target.value }))} /></Field>
      <Field id="branchCountry" label={t("employeeAccess.country")}><Input id="branchCountry" value={branch.country ?? ""} onChange={(event) => setBranch((current) => ({ ...current, country: event.target.value }))} /></Field>
      <Field id="latitude" label={t("companySettings.latitude")}><Input id="latitude" type="number" step="any" value={branch.latitude ?? ""} onChange={(event) => setBranch((current) => ({ ...current, latitude: Number(event.target.value) }))} /></Field>
      <Field id="longitude" label={t("companySettings.longitude")}><Input id="longitude" type="number" step="any" value={branch.longitude ?? ""} onChange={(event) => setBranch((current) => ({ ...current, longitude: Number(event.target.value) }))} /></Field>
      <Field id="exactRadius" label={t("companySettings.exactRadius")}><Input id="exactRadius" type="number" value={branch.exactRadiusMeters ?? 30} onChange={(event) => setBranch((current) => ({ ...current, exactRadiusMeters: Number(event.target.value) }))} /></Field>
      <div className="md:col-span-3">
        <Button type="submit" disabled={isPending}>{isPending ? t("common.saving") : t("companySettings.addBranch")}</Button>
      </div>
    </form>
  );
}

function AttendanceSettingsForm({ settings, isPending, onSubmit }: { settings: AttendanceSettings; isPending: boolean; onSubmit: (input: Partial<AttendanceSettings>) => Promise<unknown> }) {
  const { t } = useI18n();
  const [values, setValues] = useState<AttendanceSettings>(settings);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
      <Field id="grace" label={t("companySettings.gracePeriod")}><Input id="grace" type="number" value={values.gracePeriodMinutes} onChange={(event) => setValues((current) => ({ ...current, gracePeriodMinutes: Number(event.target.value) }))} /></Field>
      <Field id="firstSlice" label={t("companySettings.firstLateSlice")}><Input id="firstSlice" type="number" value={values.firstLateSliceMinutes} onChange={(event) => setValues((current) => ({ ...current, firstLateSliceMinutes: Number(event.target.value) }))} /></Field>
      <Field id="secondSlice" label={t("companySettings.secondLateSlice")}><Input id="secondSlice" type="number" value={values.secondLateSliceMinutes} onChange={(event) => setValues((current) => ({ ...current, secondLateSliceMinutes: Number(event.target.value) }))} /></Field>
      <Field id="workStart" label={t("companySettings.workStartTime")}><Input id="workStart" value={values.workStartTime} onChange={(event) => setValues((current) => ({ ...current, workStartTime: event.target.value }))} /></Field>
      <Field id="workEnd" label={t("companySettings.workEndTime")}><Input id="workEnd" value={values.workEndTime} onChange={(event) => setValues((current) => ({ ...current, workEndTime: event.target.value }))} /></Field>
      <Field id="webWifiPolicy" label={t("companySettings.webWifiPolicy")}>
        <select id="webWifiPolicy" className="ui-input" value={values.webWifiPolicy} onChange={(event) => setValues((current) => ({ ...current, webWifiPolicy: event.target.value as AttendanceSettings["webWifiPolicy"] }))}>
          <option value="MANUAL_REVIEW">{t("companySettings.manualReview")}</option>
          <option value="BLOCK">{t("companySettings.blockWeb")}</option>
          <option value="IGNORE_FOR_WEB">{t("companySettings.ignoreForWeb")}</option>
        </select>
      </Field>
      {(["requireLocation", "requireWifi", "requirePhoto", "requireDvrReview", "allowWebCheckIn", "allowMobileCheckIn"] as const).map((key) => (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(values[key])} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.checked }))} />
          {t(`companySettings.${key}`)}
        </label>
      ))}
      <div className="md:col-span-3">
        <p className="mb-3 text-sm text-[var(--color-muted)]">{t("companySettings.browserWifiLimitation")}</p>
        <Button type="submit" disabled={isPending}>{isPending ? t("common.saving") : t("companySettings.saveAttendancePolicy")}</Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
