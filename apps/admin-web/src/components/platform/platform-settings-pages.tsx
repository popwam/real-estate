"use client";

import { FormEvent } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreatePlatformPlan,
  useCreateRequiredDocumentPolicy,
  useMetadataCountries,
  useMetadataCurrencies,
  usePlatformDomainSettings,
  usePlatformModules,
  usePlatformPlans,
  usePlatformSettings,
  usePlatformSubscriptions,
  useRequiredDocumentPolicies,
} from "@/hooks/use-platform-admin";
import { useI18n } from "@/i18n";
import type { MetadataOption } from "@/types/platform";

type Section = "index" | "plans" | "subscriptions" | "verification-policies" | "modules" | "domains";

const sections: Array<{ id: Exclude<Section, "index">; href: string; key: string }> = [
  { id: "plans", href: "/platform/settings/plans", key: "platformSettings.plans" },
  { id: "subscriptions", href: "/platform/settings/subscriptions", key: "platformSettings.subscriptions" },
  { id: "verification-policies", href: "/platform/settings/verification-policies", key: "platformSettings.verificationPolicies" },
  { id: "modules", href: "/platform/settings/modules", key: "platformSettings.modules" },
  { id: "domains", href: "/platform/settings/domains", key: "platformSettings.domains" },
];

export function PlatformSettingsPage({ section = "index" }: { section?: Section }) {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("platformSettings.title")}
        description={t("platformSettings.description")}
        actions={<Settings className="h-5 w-5 text-[var(--color-muted)]" aria-hidden="true" />}
      />
      <nav className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-2">
        <Link className={navClass(section === "index")} href="/platform/settings">{t("navigation.overview")}</Link>
        {sections.map((item) => <Link key={item.id} className={navClass(section === item.id)} href={item.href}>{t(item.key)}</Link>)}
      </nav>
      {section === "index" ? <SettingsIndex /> : null}
      {section === "plans" ? <PlansSettings /> : null}
      {section === "subscriptions" ? <SubscriptionsSettings /> : null}
      {section === "verification-policies" ? <VerificationPolicySettings /> : null}
      {section === "modules" ? <ModulesSettings /> : null}
      {section === "domains" ? <DomainsSettings /> : null}
    </div>
  );
}

function SettingsIndex() {
  const { t } = useI18n();
  const { data, isLoading, error } = usePlatformSettings();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={error.message} />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((item) => (
        <Link key={item.id} className="ui-card block p-4 hover:border-[var(--color-accent)]" href={item.href}>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t(item.key)}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{t(`platformSettings.${item.id}.description`)}</p>
        </Link>
      ))}
      <DetailCard title={t("platformSettings.domainDefaults")}>
        <p className="text-sm text-[var(--color-muted)]">{data?.domains.fallbackPath ?? "/sites"}</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{data?.domains.wildcardEnabled ? t("platformSettings.wildcardEnabled") : t("platformSettings.wildcardDisabled")}</p>
      </DetailCard>
    </div>
  );
}

function PlansSettings() {
  const { t } = useI18n();
  const { data = [], error } = usePlatformPlans();
  const create = useCreatePlatformPlan();
  const currencies = useMetadataCurrencies();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      code: optional(form, "code"),
      name: optional(form, "name"),
      priceAmount: numberValue(form, "priceAmount"),
      priceCurrency: optional(form, "priceCurrency") || "EGP",
      billingCycle: optional(form, "billingCycle") as never,
      trialDays: numberValue(form, "trialDays"),
      enabledModules: selectedValues(form, "enabledModules"),
      isActive: checked(form, "isActive"),
    });
    event.currentTarget.reset();
  }
  return (
    <SettingsCollection
      title={t("platformSettings.plans")}
      rows={data.map((plan) => [plan.code, plan.name, `${plan.priceAmount ?? 0} ${plan.priceCurrency}`, plan.isActive ? t("common.active") : t("common.inactive")])}
      onSubmit={submit}
      pending={create.isPending}
      error={error?.message ?? create.error?.message}
      fields={<><TextField label={t("platformSettings.planCode")} name="code" /><TextField label={t("platformSettings.planName")} name="name" /><TextField label={t("platformSettings.price")} name="priceAmount" type="number" step="0.01" /><MetadataSelect label={t("provisioning.currency")} name="priceCurrency" options={currencies.data} defaultValue="EGP" /><SelectField label={t("provisioning.billingCycle")} name="billingCycle" options={["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]} /><TextField label={t("platformSettings.trialDays")} name="trialDays" type="number" defaultValue="0" /><MultiSelect label={t("platformSettings.enabledModules")} name="enabledModules" options={["HR", "CRM", "ACCOUNTING", "LEGAL", "MARKETING", "TEMPLATES", "REPORTS", "PUBLIC_SITE"]} /><CheckBox label={t("common.active")} name="isActive" defaultChecked /></>}
    />
  );
}

function SubscriptionsSettings() {
  const { t } = useI18n();
  const { data = [], isLoading, error } = usePlatformSubscriptions();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={error.message} />;
  return <RowsCard title={t("platformSettings.subscriptions")} rows={data.map((item) => [item.organization?.name ?? item.organizationId, item.planCode, item.status, item.billingCycle])} />;
}

function VerificationPolicySettings() {
  const { t } = useI18n();
  const { data = [], error } = useRequiredDocumentPolicies();
  const create = useCreateRequiredDocumentPolicy();
  const countries = useMetadataCountries();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      countryCode: optional(form, "countryCode"),
      organizationType: optional(form, "organizationType") as never,
      legalForm: optional(form, "legalForm"),
      documentType: optional(form, "documentType") as never,
      isRequired: checked(form, "isRequired"),
      requiresExpiryDate: checked(form, "requiresExpiryDate"),
      ownerDocumentRequired: checked(form, "ownerDocumentRequired"),
      appliesToOwnerRoles: selectedValues(form, "appliesToOwnerRoles"),
      isActive: checked(form, "isActive"),
      notes: optional(form, "notes"),
    });
    event.currentTarget.reset();
  }
  return (
    <SettingsCollection
      title={t("platformSettings.verificationPolicies")}
      rows={data.map((policy) => [policy.countryCode, policy.organizationType, policy.documentType, policy.isRequired ? t("provisioning.required") : t("common.optional")])}
      onSubmit={submit}
      pending={create.isPending}
      error={error?.message ?? create.error?.message}
      fields={<><MetadataSelect label={t("provisioning.country")} name="countryCode" options={countries.data} defaultValue="EG" /><SelectField label={t("provisioning.organizationType")} name="organizationType" options={["PLATFORM", "DEVELOPER", "BROKERAGE", "INDIVIDUAL_BROKER"]} /><SelectField label={t("provisioning.legalForm")} name="legalForm" options={["", "SOLE_PROPRIETORSHIP", "LLC", "JOINT_STOCK", "PARTNERSHIP", "BRANCH", "OTHER"]} /><SelectField label={t("provisioning.documentType")} name="documentType" options={["COMMERCIAL_REGISTER", "TAX_CARD", "VAT_CERTIFICATE", "INCORPORATION_DOCUMENT", "PROOF_OF_ADDRESS", "OWNER_ID_FRONT", "OWNER_ID_BACK", "AUTHORIZED_SIGNATORY_ID", "AUTHORIZATION_OR_POWER_OF_ATTORNEY", "BROKERAGE_LICENSE_OR_REGISTRATION"]} /><CheckBox label={t("provisioning.required")} name="isRequired" defaultChecked /><CheckBox label={t("platformSettings.requiresExpiry")} name="requiresExpiryDate" /><CheckBox label={t("platformSettings.ownerDocument")} name="ownerDocumentRequired" /><MultiSelect label={t("platformSettings.ownerRoles")} name="appliesToOwnerRoles" options={["OWNER", "PARTNER", "SHAREHOLDER", "AUTHORIZED_SIGNATORY", "LEGAL_REPRESENTATIVE"]} /><CheckBox label={t("common.active")} name="isActive" defaultChecked /><TextField label={t("provisioning.internalNotes")} name="notes" /></>}
    />
  );
}

function ModulesSettings() {
  const { t } = useI18n();
  const { data = [], isLoading, error } = usePlatformModules();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={error.message} />;
  return <RowsCard title={t("platformSettings.modules")} rows={data.map((item) => [item, t("platformSettings.available"), ""])} />;
}

function DomainsSettings() {
  const { t } = useI18n();
  const { data, isLoading, error } = usePlatformDomainSettings();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={error.message} />;
  return (
    <DetailCard title={t("platformSettings.domains")}>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label={t("platformSettings.rootDomain")} value={data?.publicRootDomain} />
        <Info label={t("platformSettings.stagingRootDomain")} value={data?.publicStagingRootDomain} />
        <Info label={t("platformSettings.fallbackPath")} value={data?.fallbackPath ?? "/sites"} />
        <Info label={t("platformSettings.wildcard")} value={data?.wildcardEnabled ? t("platformSettings.wildcardEnabled") : t("platformSettings.wildcardDisabled")} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">{t("platformSettings.domainInstructions")}</p>
    </DetailCard>
  );
}

function SettingsCollection({ title, rows, fields, onSubmit, pending, error }: { title: string; rows: string[][]; fields: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; pending: boolean; error?: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <DetailCard title={title}>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={onSubmit}>
          {fields}
          <div className="flex items-end"><Button disabled={pending} type="submit">{pending ? t("common.saving") : t("common.create")}</Button></div>
        </form>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </DetailCard>
      <RowsCard title={t("provisioning.savedRecords")} rows={rows} />
    </div>
  );
}

function RowsCard({ title, rows }: { title: string; rows: string[][] }) {
  const { t } = useI18n();
  return (
    <DetailCard title={title}>
      <div className="divide-y divide-[var(--color-border)]">
        {rows.length ? rows.map((row, index) => <div key={index} className="grid gap-2 py-3 text-sm sm:grid-cols-4">{row.map((cell, cellIndex) => <span key={cellIndex} className={cellIndex ? "text-[var(--color-muted)]" : "font-medium"}>{cell || t("common.notSet")}</span>)}</div>) : <p className="text-sm text-[var(--color-muted)]">{t("provisioning.noRecords")}</p>}
      </div>
    </DetailCard>
  );
}

function TextField({ label, name, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return <label className="space-y-2"><Label htmlFor={`settings-${name}`}>{label}</Label><Input id={`settings-${name}`} name={name} {...props} /></label>;
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return <label className="space-y-2"><Label htmlFor={`settings-${name}`}>{label}</Label><select id={`settings-${name}`} name={name} className="ui-input">{options.map((option) => <option key={option} value={option}>{option ? option.replaceAll("_", " ") : "-"}</option>)}</select></label>;
}

function MetadataSelect({ label, name, options, defaultValue }: { label: string; name: string; options?: MetadataOption[]; defaultValue?: string }) {
  return (
    <label className="space-y-2">
      <Label htmlFor={`settings-${name}`}>{label}</Label>
      <select id={`settings-${name}`} name={name} className="ui-input" defaultValue={defaultValue}>
        <option value="">{label}</option>
        {(options ?? []).map((option) => {
          const value = option.code ?? option.value ?? option.countryCode ?? "";
          return <option key={value} value={value}>{option.label ?? option.name?.en ?? value}</option>;
        })}
      </select>
    </label>
  );
}

function CheckBox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return <label className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />{label}</label>;
}

function MultiSelect({ label, name, options }: { label: string; name: string; options: string[] }) {
  return <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:col-span-2 lg:col-span-3"><legend className="px-1 text-sm font-medium">{label}</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((option) => <label key={option} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name={name} value={option} />{option.replaceAll("_", " ")}</label>)}</div></fieldset>;
}

function Info({ label, value }: { label: string; value?: string | null }) {
  const { t } = useI18n();
  return <p><span className="font-semibold text-[var(--color-foreground)]">{label}: </span><span className="text-[var(--color-muted)]">{value || t("common.notSet")}</span></p>;
}

function navClass(active: boolean) {
  return `shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold ${active ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"}`;
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

function selectedValues(data: FormData, key: string) {
  return data.getAll(key).map((value) => String(value)).filter(Boolean);
}
