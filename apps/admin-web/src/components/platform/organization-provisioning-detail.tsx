"use client";

import { FormEvent } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import {
  useCreateOrganizationAttendanceLocation,
  useCreateOrganizationOffice,
  useCreateOrganizationProvisioningDomain,
  useCreateOrganizationWifiRule,
  useOrganizationAttendanceLocations,
  useOrganizationOffices,
  useOrganizationProvisioningDomains,
  useOrganizationWifiRules,
  usePlatformOrganization,
  usePlatformOrganizationLimits,
  usePlatformOrganizationSubscription,
  useUpdatePlatformOrganization,
  useUpdatePlatformOrganizationLimits,
  useUpdatePlatformOrganizationSubscription,
} from "@/hooks/use-platform-admin";

type Tab = "overview" | "subscription" | "limits" | "offices" | "attendance" | "wifi" | "domains" | "users";

const tabPaths: Array<{ id: Tab; key: string; href: (id: string) => string }> = [
  { id: "overview", key: "provisioning.tab.overview", href: (id) => `/platform/organizations/${id}` },
  { id: "subscription", key: "provisioning.tab.subscription", href: (id) => `/platform/organizations/${id}/subscription` },
  { id: "limits", key: "provisioning.tab.limits", href: (id) => `/platform/organizations/${id}/limits` },
  { id: "offices", key: "provisioning.tab.offices", href: (id) => `/platform/organizations/${id}/offices` },
  { id: "attendance", key: "provisioning.tab.attendance", href: (id) => `/platform/organizations/${id}/attendance` },
  { id: "wifi", key: "provisioning.tab.wifi", href: (id) => `/platform/organizations/${id}/wifi-rules` },
  { id: "domains", key: "provisioning.tab.domains", href: (id) => `/platform/organizations/${id}/domains` },
  { id: "users", key: "provisioning.tab.users", href: (id) => `/platform/organizations/${id}/users/new` },
];

export function OrganizationProvisioningDetail({ tab = "overview" }: { tab?: Tab }) {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = usePlatformOrganization(id);

  if (isLoading) return <LoadingState label={t("provisioning.loadingCompany")} />;
  if (error) return <FeedbackState tone="error" title={t("organizationReview.error")} description={error.message} />;
  if (!data) return null;

  return (
    <>
      <PageHeader
        title={data.name}
        description={t("provisioning.detailDescription")}
        actions={
          <Link className="ui-button ui-button-secondary" href="/platform/organizations">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("common.back")}
          </Link>
        }
      />
      <nav className="mb-5 flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-2" aria-label={t("provisioning.companyTabs")}>
        {tabPaths.map((item) => (
          <Link
            key={item.id}
            className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold ${
              tab === item.id ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
            }`}
            href={item.href(id)}
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
      {tab === "overview" ? <OverviewTab id={id} /> : null}
      {tab === "subscription" ? <SubscriptionTab id={id} /> : null}
      {tab === "limits" ? <LimitsTab id={id} /> : null}
      {tab === "offices" ? <OfficesTab id={id} /> : null}
      {tab === "attendance" ? <AttendanceTab id={id} /> : null}
      {tab === "wifi" ? <WifiTab id={id} /> : null}
      {tab === "domains" ? <DomainsTab id={id} /> : null}
      {tab === "users" ? <UsersTab id={id} /> : null}
    </>
  );
}

function OverviewTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data } = usePlatformOrganization(id);
  const update = useUpdatePlatformOrganization(id);
  if (!data) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      name: optional(form, "name"),
      legalName: optional(form, "legalName"),
      companyCode: optional(form, "companyCode"),
      country: optional(form, "country"),
      city: optional(form, "city"),
      timezone: optional(form, "timezone"),
      currency: optional(form, "currency"),
      defaultLanguage: optional(form, "defaultLanguage"),
      businessEmail: optional(form, "businessEmail"),
      businessPhone: optional(form, "businessPhone"),
      website: optional(form, "website"),
      address: optional(form, "address"),
    });
  }

  return (
    <div className="space-y-5">
      <DetailCard title={t("provisioning.companyProfile")}>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
          <TextField label={t("provisioning.displayName")} name="name" defaultValue={data.name} />
          <TextField label={t("provisioning.legalName")} name="legalName" defaultValue={data.profile?.legalName ?? ""} />
          <TextField label={t("provisioning.companyCode")} name="companyCode" defaultValue={data.companyCode ?? ""} />
          <TextField label={t("provisioning.country")} name="country" defaultValue={data.country ?? ""} />
          <TextField label={t("provisioning.city")} name="city" defaultValue={data.city ?? ""} />
          <TextField label={t("provisioning.timezone")} name="timezone" defaultValue={data.timezone ?? ""} />
          <TextField label={t("provisioning.currency")} name="currency" defaultValue={data.currency ?? ""} />
          <TextField label={t("provisioning.defaultLanguage")} name="defaultLanguage" defaultValue={data.defaultLanguage ?? ""} />
          <TextField label={t("provisioning.businessEmail")} name="businessEmail" defaultValue={data.profile?.email ?? ""} />
          <TextField label={t("provisioning.businessPhone")} name="businessPhone" defaultValue={data.profile?.phone ?? ""} />
          <TextField label={t("provisioning.website")} name="website" defaultValue={data.profile?.website ?? ""} />
          <TextField label={t("provisioning.address")} name="address" defaultValue={data.profile?.address ?? ""} />
          <SaveButton pending={update.isPending} />
        </form>
        {update.error ? <ErrorLine message={update.error.message} /> : null}
      </DetailCard>
      <DetailCard title={t("provisioning.companyPortal")}>
        <DetailGrid
          items={[
            { label: t("provisioning.publicLink"), value: data.portalLinks?.fallbackPath },
            { label: t("provisioning.subdomain"), value: data.portalLinks?.systemSubdomain },
            { label: t("provisioning.defaultDomain"), value: data.portalLinks?.defaultDomain },
            { label: t("common.status"), value: data.status },
          ]}
        />
      </DetailCard>
    </div>
  );
}

function SubscriptionTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data } = usePlatformOrganizationSubscription(id);
  const update = useUpdatePlatformOrganizationSubscription(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      planCode: optional(form, "planCode"),
      planName: optional(form, "planName"),
      status: optional(form, "status") as never,
      startsAt: optional(form, "startsAt"),
      endsAt: optional(form, "endsAt"),
      trialEndsAt: optional(form, "trialEndsAt"),
      billingCycle: optional(form, "billingCycle") as never,
      autoRenew: checked(form, "autoRenew"),
      notes: optional(form, "notes"),
    });
  }
  return (
    <DetailCard title={t("provisioning.subscription")}>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
        <TextField label={t("provisioning.plan")} name="planCode" defaultValue={data?.planCode ?? "starter"} />
        <TextField label={t("provisioning.planName")} name="planName" defaultValue={data?.planName ?? "Starter"} />
        <SelectField label={t("common.status")} name="status" options={["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED", "SUSPENDED"]} defaultValue={data?.status ?? "TRIAL"} />
        <TextField label={t("provisioning.subscriptionStart")} name="startsAt" type="date" defaultValue={dateOnly(data?.startsAt)} />
        <TextField label={t("provisioning.subscriptionEnd")} name="endsAt" type="date" defaultValue={dateOnly(data?.endsAt)} />
        <TextField label={t("provisioning.trialEnd")} name="trialEndsAt" type="date" defaultValue={dateOnly(data?.trialEndsAt)} />
        <SelectField label={t("provisioning.billingCycle")} name="billingCycle" options={["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]} defaultValue={data?.billingCycle ?? "MONTHLY"} />
        <CheckBox label={t("provisioning.autoRenew")} name="autoRenew" defaultChecked={Boolean(data?.autoRenew)} />
        <TextField label={t("provisioning.internalNotes")} name="notes" defaultValue={data?.notes ?? ""} />
        <SaveButton pending={update.isPending} />
      </form>
      {update.error ? <ErrorLine message={update.error.message} /> : null}
    </DetailCard>
  );
}

function LimitsTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data } = usePlatformOrganizationLimits(id);
  const update = useUpdatePlatformOrganizationLimits(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      maxEmployees: numberValue(form, "maxEmployees"),
      maxOffices: numberValue(form, "maxOffices"),
      maxBranches: numberValue(form, "maxBranches"),
      maxStorageMb: numberValue(form, "maxStorageMb"),
      maxMonthlyCheckIns: numberValue(form, "maxMonthlyCheckIns"),
      allowWebCheckIn: checked(form, "allowWebCheckIn"),
      allowMobileCheckIn: checked(form, "allowMobileCheckIn"),
      allowPublicWebsite: checked(form, "allowPublicWebsite"),
      allowCustomDomain: checked(form, "allowCustomDomain"),
      allowSubdomain: checked(form, "allowSubdomain"),
      allowDvrReview: checked(form, "allowDvrReview"),
      allowFaceVerification: checked(form, "allowFaceVerification"),
    });
  }
  return (
    <DetailCard title={t("provisioning.limits")}>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
        <TextField label={t("provisioning.employeeLimit")} name="maxEmployees" type="number" defaultValue={data?.maxEmployees ?? 25} />
        <TextField label={t("provisioning.officeLimit")} name="maxOffices" type="number" defaultValue={data?.maxOffices ?? 1} />
        <TextField label={t("provisioning.branchLimit")} name="maxBranches" type="number" defaultValue={data?.maxBranches ?? 1} />
        <TextField label={t("provisioning.storageLimit")} name="maxStorageMb" type="number" defaultValue={data?.maxStorageMb ?? 1024} />
        <TextField label={t("provisioning.monthlyCheckIns")} name="maxMonthlyCheckIns" type="number" defaultValue={data?.maxMonthlyCheckIns ?? 1000} />
        <CheckBox label={t("provisioning.allowWebCheckIn")} name="allowWebCheckIn" defaultChecked={data?.allowWebCheckIn ?? true} />
        <CheckBox label={t("provisioning.allowMobileCheckIn")} name="allowMobileCheckIn" defaultChecked={data?.allowMobileCheckIn ?? true} />
        <CheckBox label={t("provisioning.allowPublicWebsite")} name="allowPublicWebsite" defaultChecked={data?.allowPublicWebsite ?? true} />
        <CheckBox label={t("provisioning.allowCustomDomain")} name="allowCustomDomain" defaultChecked={Boolean(data?.allowCustomDomain)} />
        <CheckBox label={t("provisioning.allowSubdomain")} name="allowSubdomain" defaultChecked={data?.allowSubdomain ?? true} />
        <CheckBox label={t("provisioning.allowDvrReview")} name="allowDvrReview" defaultChecked={Boolean(data?.allowDvrReview)} />
        <CheckBox label={t("provisioning.allowFaceVerification")} name="allowFaceVerification" defaultChecked={Boolean(data?.allowFaceVerification)} />
        <SaveButton pending={update.isPending} />
      </form>
      {update.error ? <ErrorLine message={update.error.message} /> : null}
    </DetailCard>
  );
}

function OfficesTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data = [] } = useOrganizationOffices(id);
  const create = useCreateOrganizationOffice(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      name: optional(form, "name"),
      code: optional(form, "code"),
      type: optional(form, "type"),
      address: optional(form, "address"),
      latitude: numberValue(form, "latitude"),
      longitude: numberValue(form, "longitude"),
      exactRadiusMeters: numberValue(form, "exactRadiusMeters"),
      expandedRadiusMeters: numberValue(form, "expandedRadiusMeters"),
      isDefault: checked(form, "isDefault"),
    });
    event.currentTarget.reset();
  }
  return <CollectionTab title={t("provisioning.offices")} rows={data.map((item) => [item.name, item.type ?? "", item.isDefault ? t("provisioning.defaultDomain") : ""])} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><TextField label={t("provisioning.officeName")} name="name" /><TextField label={t("provisioning.officeCode")} name="code" /><SelectField label={t("common.type")} name="type" options={["HEAD_OFFICE", "BRANCH", "SALES_OFFICE", "SITE", "REMOTE_HUB"]} /><TextField label={t("provisioning.address")} name="address" /><TextField label={t("provisioning.latitude")} name="latitude" type="number" step="0.000001" /><TextField label={t("provisioning.longitude")} name="longitude" type="number" step="0.000001" /><TextField label={t("provisioning.exactRadius")} name="exactRadiusMeters" type="number" defaultValue="30" /><TextField label={t("provisioning.expandedRadius")} name="expandedRadiusMeters" type="number" defaultValue="1000" /><CheckBox label={t("provisioning.defaultOffice")} name="isDefault" /></>} />;
}

function AttendanceTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data = [] } = useOrganizationAttendanceLocations(id);
  const create = useCreateOrganizationAttendanceLocation(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({ name: optional(form, "name"), latitude: numberValue(form, "latitude"), longitude: numberValue(form, "longitude"), exactRadiusMeters: numberValue(form, "exactRadiusMeters"), expandedRadiusMeters: numberValue(form, "expandedRadiusMeters"), allowedForWeb: checked(form, "allowedForWeb"), allowedForMobile: checked(form, "allowedForMobile"), requiresReviewOutsideExactRadius: checked(form, "requiresReviewOutsideExactRadius") });
    event.currentTarget.reset();
  }
  return <CollectionTab title={t("provisioning.attendanceLocations")} rows={data.map((item) => [item.name, `${item.latitude}, ${item.longitude}`, `${item.exactRadiusMeters}m / ${item.expandedRadiusMeters}m`])} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><TextField label={t("provisioning.locationName")} name="name" /><TextField label={t("provisioning.latitude")} name="latitude" type="number" step="0.000001" /><TextField label={t("provisioning.longitude")} name="longitude" type="number" step="0.000001" /><TextField label={t("provisioning.exactRadius")} name="exactRadiusMeters" type="number" defaultValue="30" /><TextField label={t("provisioning.expandedRadius")} name="expandedRadiusMeters" type="number" defaultValue="1000" /><CheckBox label={t("provisioning.allowedForWeb")} name="allowedForWeb" defaultChecked /><CheckBox label={t("provisioning.allowedForMobile")} name="allowedForMobile" defaultChecked /><CheckBox label={t("provisioning.reviewOutsideExact")} name="requiresReviewOutsideExactRadius" defaultChecked /></>} />;
}

function WifiTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data = [] } = useOrganizationWifiRules(id);
  const create = useCreateOrganizationWifiRule(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({ name: optional(form, "name"), ssid: optional(form, "ssid"), bssid: optional(form, "bssid"), macAddress: optional(form, "macAddress"), appliesTo: optional(form, "appliesTo") as never, isRequired: checked(form, "isRequired") });
    event.currentTarget.reset();
  }
  return <CollectionTab title={t("provisioning.wifiRules")} rows={data.map((item) => [item.name, item.ssid ?? "", item.appliesTo])} note={t("provisioning.browserCannotReadWifi")} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><TextField label={t("provisioning.wifiName")} name="name" /><TextField label={t("provisioning.ssid")} name="ssid" /><TextField label={t("provisioning.bssid")} name="bssid" /><TextField label={t("provisioning.macAddress")} name="macAddress" /><SelectField label={t("provisioning.appliesTo")} name="appliesTo" options={["BOTH", "MOBILE", "WEB"]} /><CheckBox label={t("provisioning.required")} name="isRequired" /></>} />;
}

function DomainsTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data = [] } = useOrganizationProvisioningDomains(id);
  const create = useCreateOrganizationProvisioningDomain(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({ domain: optional(form, "domain"), type: optional(form, "type") as never, redirectMode: optional(form, "redirectMode") as never, redirectUrl: optional(form, "redirectUrl"), inboundSourceMode: optional(form, "inboundSourceMode") as never, isDefault: checked(form, "isDefault") });
    event.currentTarget.reset();
  }
  return <CollectionTab title={t("provisioning.domains")} rows={data.map((item) => [item.domain, item.type, item.redirectMode])} note={t("provisioning.domainFallbackNote")} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><TextField label={t("provisioning.customDomain")} name="domain" /><SelectField label={t("common.type")} name="type" options={["CUSTOM_DOMAIN", "SUBDOMAIN", "PATH_ALIAS"]} /><SelectField label={t("provisioning.redirectMode")} name="redirectMode" options={["NONE", "REDIRECT_TO_EXTERNAL", "PROXY_OR_SHOW_COMPANY_PROFILE"]} /><TextField label={t("provisioning.redirectUrl")} name="redirectUrl" /><SelectField label={t("provisioning.inboundSourceMode")} name="inboundSourceMode" options={["NONE", "TRACK_REFERRER", "ACCEPT_LEADS", "WEBHOOK"]} /><CheckBox label={t("provisioning.defaultDomain")} name="isDefault" /></>} />;
}

function UsersTab({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <DetailCard title={t("provisioning.createFirstAdmin")}>
      <p className="text-sm leading-6 text-[var(--color-muted)]">{t("provisioning.usersAfterCreation")}</p>
      <Link className="ui-button ui-button-secondary mt-4" href={`/platform/organizations/${id}`}>
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        {t("provisioning.reviewCompany")}
      </Link>
    </DetailCard>
  );
}

function CollectionTab({ title, rows, fields, onSubmit, pending, error, note }: { title: string; rows: string[][]; fields: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; pending: boolean; error?: string; note?: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <DetailCard title={title}>
        {note ? <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm leading-6 text-[var(--color-muted)]">{note}</p> : null}
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={onSubmit}>
          {fields}
          <SaveButton pending={pending} label={t("common.create")} />
        </form>
        {error ? <ErrorLine message={error} /> : null}
      </DetailCard>
      <DetailCard title={t("provisioning.savedRecords")}>
        <div className="divide-y divide-[var(--color-border)]">
          {rows.length ? rows.map((row, index) => <div key={`${row[0]}-${index}`} className="grid gap-2 py-3 text-sm sm:grid-cols-3">{row.map((cell, cellIndex) => <span key={cellIndex} className={cellIndex ? "text-[var(--color-muted)]" : "font-medium text-[var(--color-foreground)]"}>{cell || t("common.notSet")}</span>)}</div>) : <p className="text-sm text-[var(--color-muted)]">{t("provisioning.noRecords")}</p>}
        </div>
      </DetailCard>
    </div>
  );
}

function TextField({ label, name, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="space-y-2">
      <Label htmlFor={`detail-${name}`}>{label}</Label>
      <Input id={`detail-${name}`} name={name} {...props} />
    </label>
  );
}

function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue?: string }) {
  return (
    <label className="space-y-2">
      <Label htmlFor={`detail-${name}`}>{label}</Label>
      <select id={`detail-${name}`} name={name} className="ui-input" defaultValue={defaultValue}>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function CheckBox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}

function SaveButton({ pending, label }: { pending: boolean; label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-end">
      <Button className="w-full" disabled={pending} type="submit">
        <Save className="h-4 w-4" aria-hidden="true" />
        {pending ? t("common.saving") : label ?? t("common.save")}
      </Button>
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>;
}

function optional(data: FormData, key: string) {
  const value = String(data.get(key) ?? "").trim();
  return value || undefined;
}

function numberValue(data: FormData, key: string) {
  const value = optional(data, key);
  return value === undefined ? undefined : Number(value);
}

function checked(data: FormData, key: string) {
  return data.get(key) === "on";
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
