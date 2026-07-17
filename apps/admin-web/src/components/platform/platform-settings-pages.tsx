"use client";

import { FormEvent, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { GripVertical, RotateCcw, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { platformNav, type NavItem } from "@/components/layout/nav";
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
import { copyPlatformPlanApi, createPlatformMetadataApi, deletePlatformPlanApi, getPlatformNavigationApi, listPlatformMetadataApi, listSupportedOrganizationTypesApi, restorePlatformNavigationApi, updatePlatformMetadataApi, updatePlatformNavigationApi, updatePlatformPlanApi } from "@/lib/api";
import type { MetadataOption, PlatformMetadataRecord, PlatformNavigationSection, PlatformPlan } from "@/types/platform";
import { localizedApiError } from "@/lib/api-errors";
import { verificationPolicyOrganizationTypeOptions } from "@/lib/verification-policy-options";

type Section = "index" | "metadata" | "plans" | "subscriptions" | "verification-policies" | "modules" | "navigation" | "domains";

const sections: Array<{ id: Exclude<Section, "index">; href: string; key: string }> = [
  { id: "metadata", href: "/platform/settings/metadata", key: "platformSettings.metadata" },
  { id: "plans", href: "/platform/settings/plans", key: "platformSettings.plans" },
  { id: "subscriptions", href: "/platform/settings/subscriptions", key: "platformSettings.subscriptions" },
  { id: "verification-policies", href: "/platform/settings/verification-policies", key: "platformSettings.verificationPolicies" },
  { id: "modules", href: "/platform/settings/modules", key: "platformSettings.modules" },
  { id: "navigation", href: "/platform/settings/navigation", key: "sidebar.settings" },
  ...(process.env.NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT === "true" ? [{ id: "domains" as const, href: "/platform/settings/domains", key: "platformSettings.domains" }] : []),
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
      {section === "metadata" ? <MetadataSettings /> : null}
      {section === "plans" ? <PlansSettings /> : null}
      {section === "subscriptions" ? <SubscriptionsSettings /> : null}
      {section === "verification-policies" ? <VerificationPolicySettings /> : null}
      {section === "modules" ? <ModulesSettings /> : null}
      {section === "navigation" ? <NavigationSettings /> : null}
      {section === "domains" ? <DomainsSettings /> : null}
    </div>
  );
}

function SettingsIndex() {
  const { t } = useI18n();
  const { data, isLoading, error, refetch } = usePlatformSettings();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={localizedApiError(error, t)} action={<Button type="button" onClick={() => refetch()}>{t("common.retry")}</Button>} />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((item) => (
        <Link key={item.id} className="ui-card block p-4 hover:border-[var(--color-accent)]" href={item.href}>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t(item.key)}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{t(`platformSettings.${item.id}.description`)}</p>
        </Link>
      ))}
      {data?.domainManagementEnabled ? <DetailCard title={t("platformSettings.domainDefaults")}><p className="text-sm text-[var(--color-muted)]">{data.domains?.fallbackPath}</p></DetailCard> : null}
    </div>
  );
}

const metadataCategories = ["COUNTRY", "CURRENCY", "LANGUAGE"] as const;

function MetadataSettings() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<(typeof metadataCategories)[number]>("COUNTRY");
  const query = useQuery({ queryKey: ["platform", "metadata", category], queryFn: () => listPlatformMetadataApi(category) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["platform", "metadata", category] });
  const create = useMutation({ mutationFn: createPlatformMetadataApi, onSuccess: refresh });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<PlatformMetadataRecord> }) => updatePlatformMetadataApi(id, input), onSuccess: refresh });
  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      category,
      code: (optional(form, "code") ?? "").toUpperCase(),
      localizedName: { en: optional(form, "en"), ar: optional(form, "ar"), fr: optional(form, "fr") },
      sortOrder: numberValue(form, "sortOrder") ?? 0,
      isActive: true,
    });
    event.currentTarget.reset();
  };
  if (query.isLoading) return <LoadingState label={t("common.loading")} />;
  return <DetailCard title={t("platformSettings.metadata")}>
    <div className="mb-4 flex gap-2 overflow-x-auto">
      {metadataCategories.map((item) => <Button key={item} type="button" className={item === category ? "" : "ui-button-secondary"} onClick={() => setCategory(item)}>{t(`platformSettings.metadata.${item.toLowerCase()}`)}</Button>)}
    </div>
    <form className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={submitCreate}>
      <TextField label={t("platformSettings.metadata.code")} name="code" required />
      <TextField label={`${t("sidebar.displayName")} (EN)`} name="en" required />
      <TextField label={`${t("sidebar.displayName")} (AR)`} name="ar" required />
      <TextField label={`${t("sidebar.displayName")} (FR)`} name="fr" required />
      <TextField label={t("platformSettings.metadata.order")} name="sortOrder" type="number" defaultValue="0" />
      <Button type="submit" disabled={create.isPending}>{t("common.add")}</Button>
    </form>
    {query.error || create.error || update.error ? <FeedbackState className="mt-3" tone="error" title={t("platformSettings.error")} description={(query.error ?? create.error ?? update.error)?.message ?? t("platformSettings.error")} /> : null}
    <div className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto pe-1">
      {(query.data ?? []).map((record) => <MetadataRecordEditor key={record.id} record={record} pending={update.isPending} onSave={(input) => update.mutate({ id: record.id, input })} />)}
      {!query.data?.length ? <p className="text-sm text-[var(--color-muted)]">{t("platformSettings.metadata.empty")}</p> : null}
    </div>
  </DetailCard>;
}

function MetadataRecordEditor({ record, pending, onSave }: { record: PlatformMetadataRecord; pending: boolean; onSave: (input: Partial<PlatformMetadataRecord>) => void }) {
  const { t } = useI18n();
  return <form className="grid gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 md:grid-cols-[8rem_1fr_1fr_1fr_auto_auto] md:items-center" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({ localizedName: { en: optional(form, "en"), ar: optional(form, "ar"), fr: optional(form, "fr") }, isActive: checked(form, "isActive") });
  }}>
    <strong className="text-sm">{record.code}</strong>
    {(["en", "ar", "fr"] as const).map((locale) => <Input key={locale} name={locale} defaultValue={record.localizedName[locale] ?? ""} aria-label={`${record.code} ${locale}`} />)}
    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={record.isActive} />{t("common.active")}</label>
    <Button type="submit" className="ui-button-secondary" disabled={pending}>{t("common.save")}</Button>
  </form>;
}

function PlansSettings() {
  const { t } = useI18n();
  const { data = [], error } = usePlatformPlans();
  const create = useCreatePlatformPlan();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<PlatformPlan> }) => updatePlatformPlanApi(id, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform", "settings", "plans"] }) });
  const copy = useMutation({ mutationFn: copyPlatformPlanApi, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform", "settings", "plans"] }) });
  const remove = useMutation({ mutationFn: deletePlatformPlanApi, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform", "settings", "plans"] }) });
  const currencies = useMetadataCurrencies();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      code: optional(form, "code"),
      name: optional(form, "name"),
      localizedName: { en: optional(form, "nameEn"), ar: optional(form, "nameAr"), fr: optional(form, "nameFr") },
      planType: optional(form, "planType") as never,
      priceAmount: numberValue(form, "priceAmount"),
      priceCurrency: optional(form, "priceCurrency"),
      billingCycle: optional(form, "billingCycle") as never,
      durationValue: numberValue(form, "durationValue"),
      durationUnit: optional(form, "durationUnit") as never,
      allowsNoExpiry: checked(form, "allowsNoExpiry"),
      trialDays: numberValue(form, "trialDays"),
      enabledModules: selectedValues(form, "enabledModules"),
      allowedLoginMethods: selectedValues(form, "allowedLoginMethods"),
      isActive: checked(form, "isActive"),
    });
    setCreateOpen(false);
    event.currentTarget.reset();
  }
  return (<div className="space-y-4">
    <div className="flex justify-end"><Button type="button" onClick={() => setCreateOpen((open) => !open)}>+ {t("common.add")} {t("platformSettings.plans")}</Button></div>
    {createOpen ? <SettingsCollection
      title={t("platformSettings.plans")}
      rows={data.map((plan) => [plan.code, plan.name, `${plan.priceAmount ?? 0} ${plan.priceCurrency}`, plan.isActive ? t("common.active") : t("common.inactive")])}
      onSubmit={submit}
      pending={create.isPending}
      error={error || create.error || update.error ? localizedApiError(error ?? create.error ?? update.error, t) : undefined}
      fields={<><TextField label={t("platformSettings.planCode")} name="code" required /><TextField label={t("platformSettings.planName")} name="name" required /><TextField label={`${t("sidebar.displayName")} (EN)`} name="nameEn" required /><TextField label={`${t("sidebar.displayName")} (AR)`} name="nameAr" required /><TextField label={`${t("sidebar.displayName")} (FR)`} name="nameFr" required /><SelectField label={t("platformSettings.planType")} name="planType" options={["FREE", "TRIAL", "PAID", "CUSTOM"]} /><TextField label={t("platformSettings.price")} name="priceAmount" type="number" step="0.01" /><MetadataSelect label={t("provisioning.currency")} name="priceCurrency" options={currencies.data} required /><SelectField label={t("provisioning.billingCycle")} name="billingCycle" options={["DAY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]} /><TextField label={t("platformSettings.durationValue")} name="durationValue" type="number" min="1" defaultValue="1" /><SelectField label={t("platformSettings.durationUnit")} name="durationUnit" options={["DAY", "MONTH", "YEAR"]} /><TextField label={t("platformSettings.trialDays")} name="trialDays" type="number" defaultValue="0" /><CheckBox label={t("platformSettings.allowsNoExpiry")} name="allowsNoExpiry" /><MultiSelect label={t("platformSettings.enabledModules")} name="enabledModules" options={["HR", "CRM", "FINANCE", "LEGAL"]} /><MultiSelect label={t("platformSettings.allowedLoginMethods")} name="allowedLoginMethods" options={["EMAIL_PASSWORD", "PHONE_PASSWORD"]} defaultValues={["EMAIL_PASSWORD", "PHONE_PASSWORD"]} /><CheckBox label={t("common.active")} name="isActive" defaultChecked /></>}
    /> : null}
    <DetailCard title={t("platformSettings.editPlans")}>
      <div className="max-h-[50vh] space-y-2 overflow-y-auto pe-1">
        {data.map((plan) => <div key={plan.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{plan.name}</strong><p className="text-sm text-[var(--color-muted)]">{plan.code} · {plan.priceAmount ?? 0} {plan.priceCurrency} · {plan.isArchived ? "Archived" : plan.isActive ? t("common.active") : t("common.inactive")}</p></div><div className="flex flex-wrap gap-2"><Button className="ui-button-secondary" type="button" onClick={() => setEditingPlanId((current) => current === plan.id ? null : plan.id)}>{t("common.edit")}</Button><Button className="ui-button-secondary" type="button" disabled={copy.isPending} onClick={() => copy.mutate(plan.id)}>Copy</Button><Button className="ui-button-secondary" type="button" disabled={update.isPending} onClick={() => update.mutate({ id: plan.id, input: { isActive: !plan.isActive } })}>{plan.isActive ? "Disable" : "Activate"}</Button><Button className="ui-button-danger" type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete ${plan.name}? Used plans will be archived and existing subscriptions remain unchanged.`)) remove.mutate(plan.id); }}>{t("common.delete")}</Button></div></div>
          {editingPlanId === plan.id ? <div className="mt-3"><PlanRecordEditor plan={plan} currencies={currencies.data} pending={update.isPending} onSave={(input) => update.mutate({ id: plan.id, input })} /></div> : null}
        </div>)}
        {!data.length ? <p className="text-sm text-[var(--color-muted)]">{t("common.noResults")}</p> : null}
      </div>
    </DetailCard>
  </div>);
}

function PlanRecordEditor({ plan, currencies, pending, onSave }: { plan: PlatformPlan; currencies?: MetadataOption[]; pending: boolean; onSave: (input: Partial<PlatformPlan>) => void }) {
  const { t } = useI18n();
  return <form className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      name: optional(form, "name"),
      localizedName: { en: optional(form, "nameEn"), ar: optional(form, "nameAr"), fr: optional(form, "nameFr") },
      planType: optional(form, "planType") as PlatformPlan["planType"],
      priceAmount: numberValue(form, "priceAmount"),
      priceCurrency: optional(form, "priceCurrency"),
      billingCycle: optional(form, "billingCycle") as PlatformPlan["billingCycle"],
      durationValue: numberValue(form, "durationValue"),
      durationUnit: optional(form, "durationUnit") as PlatformPlan["durationUnit"],
      allowsNoExpiry: checked(form, "allowsNoExpiry"),
      trialDays: numberValue(form, "trialDays"),
      enabledModules: selectedValues(form, "enabledModules"),
      allowedLoginMethods: selectedValues(form, "allowedLoginMethods"),
      isActive: checked(form, "isActive"),
    });
  }}>
    <p className="pb-3 text-sm font-semibold lg:col-span-full">{plan.code}</p>
    <TextField label={t("platformSettings.planName")} name="name" defaultValue={plan.name} required />
    <TextField label={`${t("sidebar.displayName")} (EN)`} name="nameEn" defaultValue={plan.localizedName?.en ?? plan.name} required />
    <TextField label={`${t("sidebar.displayName")} (AR)`} name="nameAr" defaultValue={plan.localizedName?.ar ?? plan.name} required />
    <TextField label={`${t("sidebar.displayName")} (FR)`} name="nameFr" defaultValue={plan.localizedName?.fr ?? plan.name} required />
    <SelectField label={t("platformSettings.planType")} name="planType" options={[plan.planType ?? "PAID", ...["FREE", "TRIAL", "PAID", "CUSTOM"].filter((value) => value !== plan.planType)]} />
    <TextField label={t("platformSettings.price")} name="priceAmount" type="number" step="0.01" defaultValue={String(plan.priceAmount ?? "")} />
    <MetadataSelect label={t("provisioning.currency")} name="priceCurrency" options={currencies} defaultValue={plan.priceCurrency} required />
    <SelectField label={t("provisioning.billingCycle")} name="billingCycle" options={[plan.billingCycle, ...["DAY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"].filter((value) => value !== plan.billingCycle)]} />
    <TextField label={t("platformSettings.durationValue")} name="durationValue" type="number" min="1" defaultValue={plan.durationValue ?? 1} />
    <SelectField label={t("platformSettings.durationUnit")} name="durationUnit" options={[plan.durationUnit ?? "MONTH", ...["DAY", "MONTH", "YEAR"].filter((value) => value !== plan.durationUnit)]} />
    <TextField label={t("platformSettings.trialDays")} name="trialDays" type="number" min="0" defaultValue={plan.trialDays ?? 0} />
    <CheckBox label={t("platformSettings.allowsNoExpiry")} name="allowsNoExpiry" defaultChecked={plan.allowsNoExpiry} />
    <MultiSelect label={t("platformSettings.enabledModules")} name="enabledModules" options={["HR", "CRM", "FINANCE", "LEGAL"]} defaultValues={plan.enabledModules} />
    <MultiSelect label={t("platformSettings.allowedLoginMethods")} name="allowedLoginMethods" options={["EMAIL_PASSWORD", "PHONE_PASSWORD"]} defaultValues={plan.allowedLoginMethods} />
    <CheckBox label={t("common.active")} name="isActive" defaultChecked={plan.isActive} />
    <Button type="submit" className="ui-button-secondary" disabled={pending}>{t("common.save")}</Button>
  </form>;
}

function SubscriptionsSettings() {
  const { t } = useI18n();
  const { data = [], isLoading, error } = usePlatformSubscriptions();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={localizedApiError(error, t)} />;
  return <RowsCard title={t("platformSettings.subscriptions")} rows={data.map((item) => [item.organization?.name ?? item.organizationId, item.planCode, item.status, item.billingCycle])} />;
}

function VerificationPolicySettings() {
  const { t, locale } = useI18n();
  const { data = [], error } = useRequiredDocumentPolicies();
  const create = useCreateRequiredDocumentPolicy();
  const countries = useMetadataCountries();
  const supportedTypes = useQuery({ queryKey: ["platform", "supported-organization-types"], queryFn: listSupportedOrganizationTypesApi });
  const policyTypeOptions = verificationPolicyOrganizationTypeOptions(supportedTypes.data ?? [], locale);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      countryCode: optional(form, "countryCode"),
      supportedOrganizationTypeId: optional(form, "supportedOrganizationTypeId"),
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
      rows={data.map((policy) => [policy.countryCode, policy.supportedOrganizationTypeNames?.[locale] ?? policy.supportedOrganizationTypeNames?.en ?? policy.supportedOrganizationTypeCode ?? policy.legacyOrganizationType ?? "", policy.documentType, policy.isRequired ? t("provisioning.required") : t("common.optional")])}
      onSubmit={submit}
      pending={create.isPending}
      error={error || create.error || supportedTypes.error ? localizedApiError(error ?? create.error ?? supportedTypes.error, t) : undefined}
      fields={<><MetadataSelect label={t("provisioning.country")} name="countryCode" options={countries.data} required /><LabeledSelect label={t("provisioning.organizationType")} name="supportedOrganizationTypeId" options={policyTypeOptions} required /><SelectField label={t("provisioning.legalForm")} name="legalForm" options={["", "SOLE_PROPRIETORSHIP", "LLC", "JOINT_STOCK", "PARTNERSHIP", "BRANCH", "OTHER"]} /><SelectField label={t("provisioning.documentType")} name="documentType" options={["COMMERCIAL_REGISTER", "TAX_CARD", "VAT_CERTIFICATE", "INCORPORATION_DOCUMENT", "PROOF_OF_ADDRESS", "OWNER_ID_FRONT", "OWNER_ID_BACK", "AUTHORIZED_SIGNATORY_ID", "AUTHORIZATION_OR_POWER_OF_ATTORNEY", "BROKERAGE_LICENSE_OR_REGISTRATION"]} /><CheckBox label={t("provisioning.required")} name="isRequired" defaultChecked /><CheckBox label={t("platformSettings.requiresExpiry")} name="requiresExpiryDate" /><CheckBox label={t("platformSettings.ownerDocument")} name="ownerDocumentRequired" /><MultiSelect label={t("platformSettings.ownerRoles")} name="appliesToOwnerRoles" options={["OWNER", "PARTNER", "SHAREHOLDER", "AUTHORIZED_SIGNATORY", "LEGAL_REPRESENTATIVE"]} /><CheckBox label={t("common.active")} name="isActive" defaultChecked /><TextField label={t("provisioning.internalNotes")} name="notes" /></>}
    />
  );
}

function ModulesSettings() {
  const { t } = useI18n();
  const { data = [], isLoading, error } = usePlatformModules();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={localizedApiError(error, t)} />;
  return <RowsCard title={t("platformSettings.modules")} rows={data.map((item) => [item, t("platformSettings.available"), ""])} />;
}

function NavigationSettings() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["platform", "navigation-configuration"], queryFn: getPlatformNavigationApi });
  const [draft, setDraft] = useState<PlatformNavigationSection[] | null>(null);
  const [draggedSectionKey, setDraggedSectionKey] = useState<string | null>(null);
  const save = useMutation({ mutationFn: updatePlatformNavigationApi, onSuccess: (data) => { queryClient.setQueryData(["platform", "navigation-configuration"], data); setDraft(data); } });
  const restore = useMutation({ mutationFn: restorePlatformNavigationApi, onSuccess: (data) => { queryClient.setQueryData(["platform", "navigation-configuration"], data); setDraft(data); } });
  const sectionsDraft = draft ?? query.data ?? [];
  const move = (index: number, offset: number) => setDraft((currentDraft) => {
    const current = currentDraft ?? query.data ?? [];
    const target = index + offset;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((section, sortOrder) => ({ ...section, sortOrder }));
  });
  const dropSection = (targetKey: string) => {
    if (!draggedSectionKey || draggedSectionKey === targetKey) return;
    const current = [...sectionsDraft];
    const from = current.findIndex((section) => section.sectionKey === draggedSectionKey);
    const to = current.findIndex((section) => section.sectionKey === targetKey);
    if (from < 0 || to < 0) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    setDraft(current.map((section, sortOrder) => ({ ...section, sortOrder })));
    setDraggedSectionKey(null);
  };
  const assignedSectionKey = (item: NavItem) => sectionsDraft.find((section) => section.allowedItemKeys.includes(item.id))?.sectionKey ?? item.sectionKey;
  const moveItem = (item: NavItem, sectionKey: string) => setDraft(sectionsDraft.map((section) => ({
    ...section,
    allowedItemKeys: section.sectionKey === sectionKey
      ? [...section.allowedItemKeys.filter((id) => id !== item.id), item.id]
      : section.allowedItemKeys.filter((id) => id !== item.id),
  })));
  if (query.isLoading) return <LoadingState label={t("common.loading")} />;
  return <DetailCard title={t("sidebar.settings")}>
    <div className="max-h-[60vh] space-y-2 overflow-y-auto pe-1">
      {sectionsDraft.map((section, index) => <div
        key={section.sectionKey}
        draggable
        onDragStart={() => setDraggedSectionKey(section.sectionKey)}
        onDragEnd={() => setDraggedSectionKey(null)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => dropSection(section.sectionKey)}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
      >
        <div className="grid gap-3 lg:grid-cols-[auto_auto_1fr_1fr_1fr] lg:items-center">
        <GripVertical className="h-5 w-5 cursor-grab text-[var(--color-muted)]" aria-label={t("sidebar.dragToReorder")} />
        <input type="checkbox" checked={section.isVisible} onChange={(event) => setDraft(sectionsDraft.map((item) => item.sectionKey === section.sectionKey ? { ...item, isVisible: event.target.checked } : item))} aria-label={t("sidebar.showItem")} />
        {(["en", "ar", "fr"] as const).map((locale) => <Input key={locale} value={section.localizedTitle[locale] ?? ""} aria-label={`${locale} ${t("sidebar.displayName")}`} onChange={(event) => setDraft(sectionsDraft.map((item) => item.sectionKey === section.sectionKey ? { ...item, localizedTitle: { ...item.localizedTitle, [locale]: event.target.value } } : item))} />)}
        <div className="flex gap-1 lg:col-start-2"><Button type="button" className="ui-button-secondary" disabled={index === 0} onClick={() => move(index, -1)}>↑</Button><Button type="button" className="ui-button-secondary" disabled={index === sectionsDraft.length - 1} onClick={() => move(index, 1)}>↓</Button></div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {platformNav.filter((item) => assignedSectionKey(item) === section.sectionKey).map((item) => <label key={item.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
            <select className="ui-input h-9 max-w-44" value={section.sectionKey} onChange={(event) => moveItem(item, event.target.value)} aria-label={`${t("sidebar.moveToSection")}: ${t(item.labelKey)}`}>
              {compatibleNavigationSections(item, sectionsDraft).map((target) => <option key={target.sectionKey} value={target.sectionKey}>{target.localizedTitle.en ?? target.sectionKey}</option>)}
            </select>
          </label>)}
        </div>
      </div>)}
    </div>
    {save.error ? <FeedbackState className="mt-3" tone="error" title={t("platformSettings.error")} description={localizedApiError(save.error, t)} /> : null}
    <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] pt-4">
      <Button type="button" className="ui-button-secondary" onClick={() => setDraft(null)}>{t("common.cancel")}</Button>
      <Button type="button" className="ui-button-secondary" onClick={() => restore.mutate()}><RotateCcw className="h-4 w-4" />{t("sidebar.reset")}</Button>
      <Button type="button" onClick={() => save.mutate(sectionsDraft)} disabled={save.isPending}>{t("common.save")}</Button>
    </div>
  </DetailCard>;
}

const navigationCompatibility: Record<string, string[]> = {
  platform: ["platform", "reports"],
  organizations: ["organizations", "platform"],
  "real-estate": ["real-estate", "documents", "reports"],
  "human-resources": ["human-resources", "documents", "reports"],
  crm: ["crm", "reports"],
  finance: ["finance", "documents", "reports"],
  legal: ["legal", "documents"],
  cameras: ["cameras", "settings"],
  advertising: ["advertising", "reports", "settings"],
  documents: ["documents", "legal", "reports"],
  reports: ["reports", "platform"],
  "my-workspace": ["my-workspace"],
  settings: ["settings", "platform"],
};

function compatibleNavigationSections(item: NavItem, sections: PlatformNavigationSection[]) {
  const allowed = new Set(navigationCompatibility[item.sectionKey] ?? [item.sectionKey]);
  return sections.filter((section) => allowed.has(section.sectionKey));
}

function DomainsSettings() {
  const { t } = useI18n();
  const { data, isLoading, error } = usePlatformDomainSettings();
  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (error) return <FeedbackState tone="error" title={t("platformSettings.error")} description={localizedApiError(error, t)} />;
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

function LabeledSelect({ label, name, options, required }: { label: string; name: string; options: Array<{ value: string; label: string }>; required?: boolean }) {
  return <label className="space-y-2"><Label htmlFor={`settings-${name}`}>{label}</Label><select id={`settings-${name}`} name={name} className="ui-input" required={required}><option value="">{label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function MetadataSelect({ label, name, options, defaultValue, required }: { label: string; name: string; options?: MetadataOption[]; defaultValue?: string; required?: boolean }) {
  return (
    <label className="space-y-2">
      <Label htmlFor={`settings-${name}`}>{label}</Label>
      <select id={`settings-${name}`} name={name} className="ui-input" defaultValue={defaultValue} required={required}>
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

function MultiSelect({ label, name, options, defaultValues = [] }: { label: string; name: string; options: string[]; defaultValues?: string[] }) {
  return <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:col-span-2 lg:col-span-3"><legend className="px-1 text-sm font-medium">{label}</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((option) => <label key={option} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name={name} value={option} defaultChecked={defaultValues.includes(option)} />{option.replaceAll("_", " ")}</label>)}</div></fieldset>;
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
