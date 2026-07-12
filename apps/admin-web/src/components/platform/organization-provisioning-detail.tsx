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
import { MapPicker } from "@/components/platform/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import {
  useCreateOrganizationAttendanceLocation,
  useActivateOrganization,
  useCompanyRoleTemplates,
  useCreateCompanyRoleTemplate,
  useCreateOrganizationDocument,
  useCreateOrganizationOffice,
  useCreateOrganizationOwner,
  useCreateOrganizationProvisioningDomain,
  useCreateOrganizationWifiRule,
  useExtractOrganizationDocument,
  useMetadataCountries,
  useMetadataCurrencies,
  useMetadataLanguages,
  useMetadataTimezones,
  useOrganizationAttendanceLocations,
  useOrganizationDocuments,
  useOrganizationDomainDiagnostics,
  useOrganizationLegal,
  useOrganizationOffices,
  useOrganizationOwners,
  useOrganizationPublicSite,
  useOrganizationProvisioningDomains,
  useOrganizationWifiRules,
  useOrganizationActivationCheck,
  usePlatformOrganization,
  usePlatformOrganizationLimits,
  usePlatformOrganizationSubscription,
  useUpdateOrganizationLegal,
  useUpdateOrganizationPublicSite,
  useReviewOrganizationDocument,
  useUpdatePlatformOrganization,
  useUpdatePlatformOrganizationLimits,
  useUpdatePlatformOrganizationSubscription,
} from "@/hooks/use-platform-admin";
import type { MetadataOption, TranslatedText } from "@/types/platform";

type Tab = "overview" | "subscription" | "limits" | "offices" | "attendance" | "wifi" | "domains" | "public-site" | "legal-tax" | "owners" | "documents" | "access-levels" | "users";

const tabPaths: Array<{ id: Tab; key: string; href: (id: string) => string }> = [
  { id: "overview", key: "provisioning.tab.overview", href: (id) => `/platform/organizations/${id}` },
  { id: "subscription", key: "provisioning.tab.subscription", href: (id) => `/platform/organizations/${id}/subscription` },
  { id: "limits", key: "provisioning.tab.limits", href: (id) => `/platform/organizations/${id}/limits` },
  { id: "offices", key: "provisioning.tab.offices", href: (id) => `/platform/organizations/${id}/offices` },
  { id: "attendance", key: "provisioning.tab.attendance", href: (id) => `/platform/organizations/${id}/attendance` },
  { id: "wifi", key: "provisioning.tab.wifi", href: (id) => `/platform/organizations/${id}/wifi-rules` },
  { id: "domains", key: "provisioning.tab.domains", href: (id) => `/platform/organizations/${id}/domains` },
  { id: "public-site", key: "provisioning.tab.publicSite", href: (id) => `/platform/organizations/${id}/public-site` },
  { id: "legal-tax", key: "provisioning.tab.legalTax", href: (id) => `/platform/organizations/${id}/legal-tax` },
  { id: "owners", key: "provisioning.tab.owners", href: (id) => `/platform/organizations/${id}/owners` },
  { id: "documents", key: "provisioning.tab.documents", href: (id) => `/platform/organizations/${id}/documents` },
  { id: "access-levels", key: "provisioning.tab.accessLevels", href: (id) => `/platform/organizations/${id}/access-levels` },
  { id: "users", key: "provisioning.tab.users", href: (id) => `/platform/organizations/${id}/users/new` },
];

const documentTypeOptions = [
  "COMMERCIAL_REGISTER",
  "TAX_CARD",
  "VAT_CERTIFICATE",
  "NATIONAL_ADDRESS",
  "LICENSE",
  "INCORPORATION_DOCUMENT",
  "PROOF_OF_ADDRESS",
  "OWNER_ID",
  "OWNER_ID_FRONT",
  "OWNER_ID_BACK",
  "AUTHORIZED_SIGNATORY_ID",
  "AUTHORIZATION_OR_POWER_OF_ATTORNEY",
  "BROKERAGE_LICENSE_OR_REGISTRATION",
  "CONTRACT",
  "OTHER",
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
      {tab === "public-site" ? <PublicSiteTab id={id} /> : null}
      {tab === "legal-tax" ? <LegalTaxTab id={id} /> : null}
      {tab === "owners" ? <OwnersTab id={id} /> : null}
      {tab === "documents" ? <DocumentsTab id={id} /> : null}
      {tab === "access-levels" ? <AccessLevelsTab id={id} /> : null}
      {tab === "users" ? <UsersTab id={id} /> : null}
    </>
  );
}

function OverviewTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data } = usePlatformOrganization(id);
  const activation = useOrganizationActivationCheck(id);
  const activate = useActivateOrganization(id);
  const update = useUpdatePlatformOrganization(id);
  const countries = useMetadataCountries();
  const currencies = useMetadataCurrencies();
  const languages = useMetadataLanguages();
  const timezones = useMetadataTimezones();
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
          <MetadataSelect label={t("provisioning.country")} name="country" options={countries.data} defaultValue={data.country ?? ""} />
          <TextField label={t("provisioning.city")} name="city" defaultValue={data.city ?? ""} />
          <MetadataSelect label={t("provisioning.timezone")} name="timezone" options={timezones.data} defaultValue={data.timezone ?? ""} />
          <MetadataSelect label={t("provisioning.currency")} name="currency" options={currencies.data} defaultValue={data.currency ?? ""} />
          <MetadataSelect label={t("provisioning.defaultLanguage")} name="defaultLanguage" options={languages.data} defaultValue={data.defaultLanguage ?? ""} />
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
      <DetailCard title={t("verification.activationGate")}>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {activation.data?.canActivate ? t("verification.readyToActivate") : t("verification.activationBlocked")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <RequirementList title={t("verification.requiredDocuments")} items={activation.data?.blockingDocuments ?? []} empty={t("verification.documentsApproved")} />
              <RequirementList title={t("verification.subscription")} items={activation.data?.blockingSubscriptionReasons ?? []} empty={t("verification.subscriptionReady")} />
              <RequirementList title={t("verification.offices")} items={activation.data?.blockingOfficeReasons ?? []} empty={t("verification.officesReady")} />
              <RequirementList title={t("verification.firstAdmin")} items={activation.data?.blockingAdminReasons ?? []} empty={t("verification.firstAdminReady")} />
              <RequirementList title={t("verification.owners")} items={activation.data?.blockingOwners ?? []} empty={t("verification.ownersReady")} />
              <RequirementList title={t("provisioning.missingRequirements")} items={activation.data?.missingRequirements ?? []} empty={t("verification.noMissingRequirements")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" disabled={!activation.data?.canActivate || activate.isPending} onClick={() => activate.mutate()}>
              {activate.isPending ? t("common.saving") : t("verification.activateCompany")}
            </Button>
            {activation.isLoading ? <p className="text-xs text-[var(--color-muted)]">{t("common.loading")}</p> : null}
          </div>
        </div>
        {activate.error ? <ErrorLine message={activate.error.message} /> : null}
      </DetailCard>
    </div>
  );
}

function RequirementList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">{title}</p>
      {items.length ? (
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-red-700">
          {items.map((item) => <li key={item}>{item.replaceAll("_", " ")}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-muted)]">{empty}</p>
      )}
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
  return <CollectionTab title={t("provisioning.offices")} rows={data.map((item) => [item.name, item.type ?? "", item.isDefault ? t("provisioning.defaultDomain") : ""])} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><TextField label={t("provisioning.officeName")} name="name" /><TextField label={t("provisioning.officeCode")} name="code" /><SelectField label={t("common.type")} name="type" options={["HEAD_OFFICE", "BRANCH", "SALES_OFFICE", "SITE", "REMOTE_HUB"]} /><MapPicker addressName="address" latitudeName="latitude" longitudeName="longitude" exactRadiusName="exactRadiusMeters" expandedRadiusName="expandedRadiusMeters" /><CheckBox label={t("provisioning.defaultOffice")} name="isDefault" /></>} />;
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
  return <CollectionTab title={t("provisioning.attendanceLocations")} rows={data.map((item) => [item.name, `${item.latitude}, ${item.longitude}`, `${item.exactRadiusMeters}m / ${item.expandedRadiusMeters}m`])} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><TextField label={t("provisioning.locationName")} name="name" /><MapPicker addressName="address" latitudeName="latitude" longitudeName="longitude" exactRadiusName="exactRadiusMeters" expandedRadiusName="expandedRadiusMeters" /><CheckBox label={t("provisioning.allowedForWeb")} name="allowedForWeb" defaultChecked /><CheckBox label={t("provisioning.allowedForMobile")} name="allowedForMobile" defaultChecked /><CheckBox label={t("provisioning.reviewOutsideExact")} name="requiresReviewOutsideExactRadius" defaultChecked /></>} />;
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
  const diagnostics = useOrganizationDomainDiagnostics(id);
  const create = useCreateOrganizationProvisioningDomain(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({ domain: optional(form, "domain"), type: optional(form, "type") as never, redirectMode: optional(form, "redirectMode") as never, redirectUrl: optional(form, "redirectUrl"), inboundSourceMode: optional(form, "inboundSourceMode") as never, isDefault: checked(form, "isDefault") });
    event.currentTarget.reset();
  }
  return (
    <div className="space-y-5">
      <CollectionTab title={t("provisioning.domains")} rows={data.map((item) => [item.domain, item.type, item.redirectMode])} note={t("provisioning.domainFallbackNote")} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><TextField label={t("provisioning.customDomain")} name="domain" /><SelectField label={t("common.type")} name="type" options={["CUSTOM_DOMAIN", "SUBDOMAIN", "PATH_ALIAS"]} /><SelectField label={t("provisioning.redirectMode")} name="redirectMode" options={["NONE", "REDIRECT_TO_EXTERNAL", "PROXY_OR_SHOW_COMPANY_PROFILE"]} /><TextField label={t("provisioning.redirectUrl")} name="redirectUrl" /><SelectField label={t("provisioning.inboundSourceMode")} name="inboundSourceMode" options={["NONE", "TRACK_REFERRER", "ACCEPT_LEADS", "WEBHOOK"]} /><CheckBox label={t("provisioning.defaultDomain")} name="isDefault" /></>} />
      <DetailCard title={t("provisioning.domainDiagnostics")}>
        <p className="text-sm leading-6 text-[var(--color-muted)]">{diagnostics.data?.instructions.resourceNote ?? t("provisioning.domainDiagnosticsLoading")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(diagnostics.data?.codes ?? []).map((code) => <span key={code} className="ui-badge">{code}</span>)}
        </div>
        {diagnostics.data?.fallbackLink ? <p className="mt-4 break-all text-sm text-[var(--color-muted)]">{diagnostics.data.fallbackLink}</p> : null}
      </DetailCard>
    </div>
  );
}

function PublicSiteTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data } = useOrganizationPublicSite(id);
  const update = useUpdateOrganizationPublicSite(id);
  const languages = useMetadataLanguages();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      mode: optional(form, "mode") as never,
      theme: optional(form, "theme") as never,
      defaultLanguage: optional(form, "defaultLanguage"),
      supportedLanguages: selectedValues(form, "supportedLanguages"),
      showLogo: checked(form, "showLogo"),
      showContactInfo: checked(form, "showContactInfo"),
      showOffices: checked(form, "showOffices"),
      showGallery: checked(form, "showGallery"),
      showProjects: checked(form, "showProjects"),
      showLeadForm: checked(form, "showLeadForm"),
      redirectUrl: optional(form, "redirectUrl"),
      publicHeadline: translatedFromForm(form, "headline"),
      publicDescription: translatedFromForm(form, "description"),
      seoTitle: translatedFromForm(form, "seoTitle"),
      seoDescription: translatedFromForm(form, "seoDescription"),
      galleryImages: galleryFromText(optional(form, "galleryImages")),
    });
  }
  return (
    <DetailCard title={t("provisioning.publicSite")}>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
        <SelectField label={t("provisioning.publicSiteMode")} name="mode" options={["DISABLED", "PORTAL", "GALLERY", "REDIRECT"]} defaultValue={data?.mode ?? "PORTAL"} />
        <SelectField label={t("provisioning.theme")} name="theme" options={["MINIMAL", "MODERN", "REAL_ESTATE", "CORPORATE", "GALLERY", "DARK_PREMIUM"]} defaultValue={data?.theme ?? "REAL_ESTATE"} />
        <MetadataSelect label={t("provisioning.defaultLanguage")} name="defaultLanguage" options={languages.data} defaultValue={data?.defaultLanguage ?? "en"} />
        <MultiLanguageField label={t("provisioning.supportedLanguages")} name="supportedLanguages" options={languages.data} values={data?.supportedLanguages ?? ["en", "ar", "fr"]} />
        <TextField label={t("provisioning.redirectUrl")} name="redirectUrl" defaultValue={data?.redirectUrl ?? ""} />
        <TextField label={t("provisioning.galleryImages")} name="galleryImages" defaultValue={galleryToText(data?.galleryImages)} placeholder="https://example.com/image.jpg" />
        <TranslatedTextInput label={t("provisioning.headlineTranslations")} name="headline" value={data?.publicHeadline} />
        <TranslatedTextInput label={t("provisioning.descriptionTranslations")} name="description" value={data?.publicDescription} />
        <TranslatedTextInput label={t("provisioning.seoTitleTranslations")} name="seoTitle" value={data?.seoTitle} />
        <TranslatedTextInput label={t("provisioning.seoDescriptionTranslations")} name="seoDescription" value={data?.seoDescription} />
        <CheckBox label={t("provisioning.showLogo")} name="showLogo" defaultChecked={data?.showLogo ?? true} />
        <CheckBox label={t("provisioning.showContactInfo")} name="showContactInfo" defaultChecked={data?.showContactInfo ?? true} />
        <CheckBox label={t("provisioning.showOffices")} name="showOffices" defaultChecked={data?.showOffices ?? true} />
        <CheckBox label={t("provisioning.showGallery")} name="showGallery" defaultChecked={data?.showGallery ?? true} />
        <CheckBox label={t("provisioning.showProjects")} name="showProjects" defaultChecked={data?.showProjects ?? true} />
        <CheckBox label={t("provisioning.showLeadForm")} name="showLeadForm" defaultChecked={data?.showLeadForm ?? true} />
        <SaveButton pending={update.isPending} />
      </form>
      <p className="mt-4 text-sm text-[var(--color-muted)]">{t("provisioning.redirectResourceNote")}</p>
      {update.error ? <ErrorLine message={update.error.message} /> : null}
    </DetailCard>
  );
}

function LegalTaxTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data } = useOrganizationLegal(id);
  const update = useUpdateOrganizationLegal(id);
  const countries = useMetadataCountries();
  const currencies = useMetadataCurrencies();
  const languages = useMetadataLanguages();
  const timezones = useMetadataTimezones();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      legalName: optional(form, "legalName"),
      tradeName: optional(form, "tradeName"),
      displayName: optional(form, "displayName"),
      registrationNumber: optional(form, "registrationNumber"),
      commercialRegisterNumber: optional(form, "commercialRegisterNumber"),
      commercialRegisterOffice: optional(form, "commercialRegisterOffice"),
      commercialRegisterIssuedAt: optional(form, "commercialRegisterIssuedAt"),
      commercialRegisterExpiresAt: optional(form, "commercialRegisterExpiresAt"),
      taxNumber: optional(form, "taxNumber"),
      vatNumber: optional(form, "vatNumber"),
      taxOffice: optional(form, "taxOffice"),
      legalForm: optional(form, "legalForm"),
      incorporationDate: optional(form, "incorporationDate"),
      countryCode: optional(form, "countryCode"),
      regionCode: optional(form, "regionCode"),
      cityName: optional(form, "cityName"),
      addressLine1: optional(form, "addressLine1"),
      addressLine2: optional(form, "addressLine2"),
      postalCode: optional(form, "postalCode"),
      preferredLanguage: optional(form, "preferredLanguage"),
      defaultCurrency: optional(form, "defaultCurrency"),
      timezone: optional(form, "timezone"),
      website: optional(form, "website"),
      publicEmail: optional(form, "publicEmail"),
      publicPhone: optional(form, "publicPhone"),
    });
  }
  return (
    <DetailCard title={t("provisioning.legalTax")}>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
        <TextField label={t("provisioning.legalName")} name="legalName" defaultValue={data?.legalName ?? ""} />
        <TextField label={t("provisioning.tradeName")} name="tradeName" defaultValue={data?.tradeName ?? ""} />
        <TextField label={t("provisioning.displayName")} name="displayName" defaultValue={data?.displayName ?? ""} />
        <TextField label={t("provisioning.registrationNumber")} name="registrationNumber" defaultValue={data?.registrationNumber ?? ""} />
        <TextField label={t("provisioning.commercialRegister")} name="commercialRegisterNumber" defaultValue={data?.commercialRegisterNumber ?? ""} />
        <TextField label={t("provisioning.registrationOffice")} name="commercialRegisterOffice" defaultValue={data?.commercialRegisterOffice ?? ""} />
        <TextField label={t("provisioning.issueDate")} name="commercialRegisterIssuedAt" type="date" defaultValue={dateOnly(data?.commercialRegisterIssuedAt)} />
        <TextField label={t("provisioning.expiryDate")} name="commercialRegisterExpiresAt" type="date" defaultValue={dateOnly(data?.commercialRegisterExpiresAt)} />
        <TextField label={t("provisioning.taxNumber")} name="taxNumber" defaultValue={data?.taxNumber ?? ""} />
        <TextField label={t("provisioning.vatNumber")} name="vatNumber" defaultValue={data?.vatNumber ?? ""} />
        <TextField label={t("provisioning.taxOffice")} name="taxOffice" defaultValue={data?.taxOffice ?? ""} />
        <SelectField label={t("provisioning.legalForm")} name="legalForm" options={["SOLE_PROPRIETORSHIP", "LLC", "JOINT_STOCK", "PARTNERSHIP", "BRANCH", "OTHER"]} defaultValue={data?.legalForm ?? "LLC"} />
        <TextField label={t("provisioning.incorporationDate")} name="incorporationDate" type="date" defaultValue={dateOnly(data?.incorporationDate)} />
        <MetadataSelect label={t("provisioning.country")} name="countryCode" options={countries.data} defaultValue={data?.countryCode ?? ""} />
        <TextField label={t("provisioning.region")} name="regionCode" defaultValue={data?.regionCode ?? ""} />
        <TextField label={t("provisioning.city")} name="cityName" defaultValue={data?.cityName ?? ""} />
        <MetadataSelect label={t("provisioning.currency")} name="defaultCurrency" options={currencies.data} defaultValue={data?.defaultCurrency ?? ""} />
        <MetadataSelect label={t("provisioning.defaultLanguage")} name="preferredLanguage" options={languages.data} defaultValue={data?.preferredLanguage ?? "en"} />
        <MetadataSelect label={t("provisioning.timezone")} name="timezone" options={timezones.data} defaultValue={data?.timezone ?? ""} />
        <TextField label={t("provisioning.addressLine1")} name="addressLine1" defaultValue={data?.addressLine1 ?? ""} />
        <TextField label={t("provisioning.addressLine2")} name="addressLine2" defaultValue={data?.addressLine2 ?? ""} />
        <TextField label={t("provisioning.postalCode")} name="postalCode" defaultValue={data?.postalCode ?? ""} />
        <TextField label={t("provisioning.website")} name="website" defaultValue={data?.website ?? ""} />
        <TextField label={t("provisioning.publicEmail")} name="publicEmail" defaultValue={data?.publicEmail ?? ""} />
        <TextField label={t("provisioning.publicPhone")} name="publicPhone" defaultValue={data?.publicPhone ?? ""} />
        <SaveButton pending={update.isPending} />
      </form>
      {update.error ? <ErrorLine message={update.error.message} /> : null}
    </DetailCard>
  );
}

function OwnersTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data = [] } = useOrganizationOwners(id);
  const create = useCreateOrganizationOwner(id);
  const countries = useMetadataCountries();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      ownerType: optional(form, "ownerType") as never,
      name: optional(form, "name"),
      localizedName: translatedFromForm(form, "ownerName"),
      nationalityCountryCode: optional(form, "nationalityCountryCode"),
      identifierType: optional(form, "identifierType") as never,
      identifierValue: optional(form, "identifierValue"),
      identifierCountryCode: optional(form, "identifierCountryCode"),
      ownershipPercentage: numberValue(form, "ownershipPercentage"),
      role: optional(form, "role") as never,
      phone: optional(form, "phone"),
      email: optional(form, "email"),
      idFrontFileId: optional(form, "idFrontFileId"),
      idBackFileId: optional(form, "idBackFileId"),
      passportFileId: optional(form, "passportFileId"),
      proofFileId: optional(form, "proofFileId"),
    });
    event.currentTarget.reset();
  }
  return <CollectionTab title={t("provisioning.owners")} rows={data.map((owner) => [owner.name, `${owner.role} ${owner.ownershipPercentage ?? 0}%`, owner.missingDocuments ? t("provisioning.missingDocuments") : owner.verificationStatus])} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><SelectField label={t("common.type")} name="ownerType" options={["PERSON", "COMPANY"]} /><TextField label={t("provisioning.ownerName")} name="name" /><TranslatedTextInput label={t("provisioning.ownerLocalizedName")} name="ownerName" /><MetadataSelect label={t("provisioning.nationality")} name="nationalityCountryCode" options={countries.data} /><SelectField label={t("provisioning.identifierType")} name="identifierType" options={["NATIONAL_ID", "PASSPORT", "RESIDENCE_ID", "TAX_ID", "COMMERCIAL_REGISTER", "OTHER"]} /><TextField label={t("provisioning.identifierValue")} name="identifierValue" /><MetadataSelect label={t("provisioning.identifierCountry")} name="identifierCountryCode" options={countries.data} /><TextField label={t("provisioning.ownershipPercentage")} name="ownershipPercentage" type="number" step="0.01" /><SelectField label={t("provisioning.ownerRole")} name="role" options={["OWNER", "PARTNER", "SHAREHOLDER", "AUTHORIZED_SIGNATORY", "LEGAL_REPRESENTATIVE"]} /><TextField label={t("provisioning.phone")} name="phone" /><TextField label={t("provisioning.email")} name="email" type="email" /><TextField label={t("provisioning.idFrontFileId")} name="idFrontFileId" /><TextField label={t("provisioning.idBackFileId")} name="idBackFileId" /><TextField label={t("provisioning.passportFileId")} name="passportFileId" /><TextField label={t("provisioning.proofFileId")} name="proofFileId" /></>} />;
}

function DocumentsTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data } = useOrganizationDocuments(id);
  const create = useCreateOrganizationDocument(id);
  const extract = useExtractOrganizationDocument(id);
  const review = useReviewOrganizationDocument(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      documentType: optional(form, "documentType") as never,
      fileId: optional(form, "fileId"),
      expiresAt: optional(form, "expiresAt"),
      issuedAt: optional(form, "issuedAt"),
      issuingAuthority: optional(form, "issuingAuthority"),
    });
    event.currentTarget.reset();
  }
  const docs = data?.documents ?? [];
  return (
    <div className="space-y-5">
      <CollectionTab title={t("provisioning.documents")} rows={docs.map((doc) => [doc.documentType, doc.status, doc.extractionStatus])} note={`${t("provisioning.requiredDocuments")}: ${(data?.required ?? []).join(", ")}`} onSubmit={submit} pending={create.isPending} error={create.error?.message} fields={<><SelectField label={t("provisioning.documentType")} name="documentType" options={documentTypeOptions} /><TextField label={t("provisioning.fileId")} name="fileId" /><TextField label={t("provisioning.issueDate")} name="issuedAt" type="date" /><TextField label={t("provisioning.expiryDate")} name="expiresAt" type="date" /><TextField label={t("provisioning.issuingAuthority")} name="issuingAuthority" /></>} />
      <DetailCard title={t("provisioning.extractedData")}>
        <div className="divide-y divide-[var(--color-border)]">
          {docs.length ? docs.map((doc) => (
            <div key={doc.id} className="grid gap-3 py-3 text-sm lg:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold">{doc.documentType}</p>
                <p className="text-[var(--color-muted)]">{doc.extractionMessage ?? t("provisioning.ocrProviderNotConfigured")}</p>
                <pre className="mt-2 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3 text-xs">{JSON.stringify(doc.extractedData ?? {}, null, 2)}</pre>
              </div>
              <div className="flex flex-wrap gap-2 self-start">
                <Button type="button" className="ui-button-secondary" onClick={() => extract.mutate(doc.id)} disabled={extract.isPending}>
                  {t("provisioning.extractData")}
                </Button>
                <Button type="button" onClick={() => review.mutate({ documentId: doc.id, input: { status: "APPROVED" } })} disabled={review.isPending}>
                  {t("verification.approveDocument")}
                </Button>
                <Button type="button" className="ui-button-secondary" onClick={() => {
                  const note = window.prompt(t("verification.rejectionReason"));
                  if (note) review.mutate({ documentId: doc.id, input: { status: "REJECTED", note } });
                }} disabled={review.isPending}>
                  {t("verification.rejectDocument")}
                </Button>
              </div>
            </div>
          )) : <p className="text-sm text-[var(--color-muted)]">{t("provisioning.noRecords")}</p>}
        </div>
      </DetailCard>
    </div>
  );
}

function AccessLevelsTab({ id }: { id: string }) {
  const { t } = useI18n();
  const { data = [] } = useCompanyRoleTemplates(id);
  const create = useCreateCompanyRoleTemplate(id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      code: optional(form, "code"),
      displayName: optional(form, "displayName"),
      localizedName: translatedFromForm(form, "roleName"),
      description: optional(form, "description"),
      permissions: selectedValues(form, "permissions"),
      isActive: checked(form, "isActive"),
      sortOrder: numberValue(form, "sortOrder"),
    });
    event.currentTarget.reset();
  }
  return (
    <CollectionTab
      title={t("accessLevels.title")}
      rows={data.map((item) => [item.displayName, item.code, `${item.permissions.length} ${t("accessLevels.permissions")}`])}
      note={t("accessLevels.companyScopedNote")}
      onSubmit={submit}
      pending={create.isPending}
      error={create.error?.message}
      fields={
        <>
          <TextField label={t("accessLevels.code")} name="code" />
          <TextField label={t("accessLevels.displayName")} name="displayName" />
          <TranslatedTextInput label={t("accessLevels.localizedName")} name="roleName" />
          <TextField label={t("accessLevels.description")} name="description" />
          <TextField label={t("accessLevels.sortOrder")} name="sortOrder" type="number" defaultValue="100" />
          <CheckBox label={t("common.active")} name="isActive" defaultChecked />
          <PermissionPicker />
        </>
      }
    />
  );
}

function PermissionPicker() {
  const { t } = useI18n();
  const permissions = [
    "company.dashboard.view",
    "company.settings.view",
    "company.settings.manage",
    "company.profile.view",
    "company.profile.manage",
    "company.offices.view",
    "company.offices.manage",
    "company.attendance_locations.view",
    "company.attendance_locations.manage",
    "company.wifi_rules.view",
    "company.wifi_rules.manage",
    "company.access_levels.view",
    "company.access_levels.manage",
    "hr.view",
    "hr.manage",
    "hr.employees.view",
    "hr.recruitment.view",
    "crm.leads.view_own",
    "crm.leads.manage_own",
    "reports.view",
  ];
  return (
    <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-medium">{t("accessLevels.permissions")}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {permissions.map((permission) => (
          <label key={permission} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input type="checkbox" name="permissions" value={permission} />
            {permission}
          </label>
        ))}
      </div>
    </fieldset>
  );
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

function MetadataSelect({ label, name, options, defaultValue }: { label: string; name: string; options?: MetadataOption[]; defaultValue?: string }) {
  return (
    <label className="space-y-2">
      <Label htmlFor={`detail-${name}`}>{label}</Label>
      <select id={`detail-${name}`} name={name} className="ui-input" defaultValue={defaultValue}>
        <option value="">{label}</option>
        {(options ?? []).map((option) => {
          const value = option.code ?? option.value ?? option.countryCode ?? "";
          return <option key={value} value={value}>{optionLabel(option)}</option>;
        })}
      </select>
    </label>
  );
}

function MultiLanguageField({ label, name, options, values }: { label: string; name: string; options?: MetadataOption[]; values: string[] }) {
  return (
    <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {(options ?? []).map((option) => {
          const value = option.code ?? "";
          return (
            <label key={value} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name={name} value={value} defaultChecked={values.includes(value)} />
              {optionLabel(option)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function TranslatedTextInput({ label, name, value }: { label: string; name: string; value?: TranslatedText | null }) {
  const { t } = useI18n();
  return (
    <fieldset className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField label="EN" name={`${name}En`} defaultValue={value?.en ?? ""} placeholder={t("translatedText.placeholder.en")} />
        <TextField label="AR" name={`${name}Ar`} defaultValue={value?.ar ?? ""} placeholder={t("translatedText.placeholder.ar")} dir="rtl" />
        <TextField label="FR" name={`${name}Fr`} defaultValue={value?.fr ?? ""} placeholder={t("translatedText.placeholder.fr")} />
      </div>
    </fieldset>
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

function optionLabel(option: MetadataOption) {
  return option.label ?? option.name?.en ?? option.code ?? option.value ?? option.countryCode ?? "";
}

function selectedValues(data: FormData, key: string) {
  return data.getAll(key).map(String).filter(Boolean);
}

function translatedFromForm(data: FormData, key: string) {
  return {
    en: optional(data, `${key}En`) ?? "",
    ar: optional(data, `${key}Ar`) ?? "",
    fr: optional(data, `${key}Fr`) ?? "",
  };
}

function galleryFromText(value?: string) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((url) => ({ url, alt: { en: "", ar: "", fr: "" }, caption: { en: "", ar: "", fr: "" } }));
}

function galleryToText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => (typeof item?.url === "string" ? item.url : "")).filter(Boolean).join("\n");
}
