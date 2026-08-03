"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { DetailCard } from "@/components/platform/detail-card";
import { MapPicker } from "@/components/platform/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { SESSION_QUERY_KEY } from "@/components/providers/auth-session-provider";
import {
  getAttendanceSettingsApi,
  createCompanyAccessLevelApi,
  listCompanyAccessLevelsApi,
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
  const branches = useQuery({ queryKey: ["hr-branches"], queryFn: () => listBranchesApi() });
  const settings = useQuery({ queryKey: ["hr-attendance-settings"], queryFn: getAttendanceSettingsApi });
  const accessLevels = useQuery({ queryKey: ["company-access-levels"], queryFn: listCompanyAccessLevelsApi });
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
  const createAccessLevel = useMutation({
    mutationFn: createCompanyAccessLevelApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["company-access-levels"] });
      await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY, exact: true });
    },
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

      <DetailCard title={t("accessLevels.title")}>
        <AccessLevelForm isPending={createAccessLevel.isPending} onSubmit={(input) => createAccessLevel.mutateAsync(input)} />
        {accessLevels.isLoading ? <LoadingState label={t("common.loading")} /> : null}
        {accessLevels.data?.length ? (
          <div className="mt-5 grid gap-3">
            {accessLevels.data.map((level) => (
              <div key={level.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm">
                <p className="font-semibold text-[var(--color-foreground)]">{level.displayName}</p>
                <p className="text-[var(--color-muted)]">{level.permissions.length} {t("accessLevels.permissions")}</p>
              </div>
            ))}
          </div>
        ) : null}
        {createAccessLevel.error ? <FeedbackState className="mt-4" tone="error" title={t("accessLevels.title")} description={createAccessLevel.error.message} /> : null}
      </DetailCard>
    </div>
  );
}

function AccessLevelForm({ isPending, onSubmit }: { isPending: boolean; onSubmit: (input: { code?: string; displayName?: string; description?: string; permissions: string[]; isActive: boolean; sortOrder?: number }) => Promise<unknown> }) {
  const { t } = useI18n();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      code: optional(form, "code"),
      displayName: optional(form, "displayName"),
      description: optional(form, "description"),
      permissions: form.getAll("permissions").map(String),
      isActive: form.get("isActive") === "on",
      sortOrder: numberValue(form, "sortOrder"),
    });
    event.currentTarget.reset();
  }
  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
      <Field id="accessLevelCode" label={t("accessLevels.code")}><Input id="accessLevelCode" name="code" /></Field>
      <Field id="accessLevelName" label={t("accessLevels.displayName")}><Input id="accessLevelName" name="displayName" required /></Field>
      <Field id="accessLevelDescription" label={t("accessLevels.description")}><Input id="accessLevelDescription" name="description" /></Field>
      <Field id="accessLevelSort" label={t("accessLevels.sortOrder")}><Input id="accessLevelSort" name="sortOrder" type="number" defaultValue="100" /></Field>
      <label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked />{t("common.active")}</label>
      <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 md:col-span-3">
        <legend className="px-1 text-sm font-medium">{t("accessLevels.permissions")}</legend>
        <div className="grid gap-2 md:grid-cols-3">
          {["company.dashboard.view", "company.settings.view", "company.profile.manage", "company.offices.manage", "company.wifi_rules.manage", "company.access_levels.view", "hr.view", "hr.employees.view", "hr.recruitment.view", "crm.leads.view_own", "reports.view"].map((permission) => (
            <label key={permission} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="permissions" value={permission} />{permission}</label>
          ))}
        </div>
      </fieldset>
      <div className="md:col-span-3">
        <Button type="submit" disabled={isPending}>{isPending ? t("common.saving") : t("common.create")}</Button>
      </div>
    </form>
  );
}

function BranchForm({ isPending, onSubmit }: { isPending: boolean; onSubmit: (input: Partial<OrganizationBranch>) => Promise<unknown> }) {
  const { t } = useI18n();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      name: optional(form, "name"),
      city: optional(form, "city"),
      country: optional(form, "country"),
      address: optional(form, "address"),
      latitude: numberValue(form, "latitude"),
      longitude: numberValue(form, "longitude"),
      exactRadiusMeters: numberValue(form, "exactRadiusMeters") ?? 30,
      expandedRadiusMeters: numberValue(form, "expandedRadiusMeters") ?? 1000,
    });
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
      <Field id="branchName" label={t("companySettings.branchName")}><Input id="branchName" name="name" required /></Field>
      <Field id="branchCity" label={t("companySettings.city")}><Input id="branchCity" name="city" /></Field>
      <Field id="branchCountry" label={t("employeeAccess.country")}><Input id="branchCountry" name="country" /></Field>
      <MapPicker addressName="address" latitudeName="latitude" longitudeName="longitude" exactRadiusName="exactRadiusMeters" expandedRadiusName="expandedRadiusMeters" />
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

function optional(data: FormData, key: string) {
  const value = String(data.get(key) ?? "").trim();
  return value || undefined;
}

function numberValue(data: FormData, key: string) {
  const value = optional(data, key);
  return value === undefined ? undefined : Number(value);
}
