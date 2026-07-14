"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Building2 } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { MapPicker } from "@/components/platform/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePlatformOrganization, useMetadataCountries, useMetadataCurrencies, useMetadataLanguages, useMetadataOrganizationTypes, useMetadataTimezones, usePlatformPlans } from "@/hooks/use-platform-admin";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { isOrganizationTypeCode, ORGANIZATION_TYPE_CODES } from "@/lib/organization-types";
import type { MetadataOption, PlatformOrganizationInput } from "@/types/platform";

const steps = [
  "company",
  "subscription",
  "limits",
  "offices",
  "attendance",
  "wifi",
  "domains",
  "admin",
  "review",
] as const;

type StepId = (typeof steps)[number];

const stepKeys: Record<StepId, string> = {
  company: "provisioning.step.company",
  subscription: "provisioning.step.subscription",
  limits: "provisioning.step.limits",
  offices: "provisioning.step.offices",
  attendance: "provisioning.step.attendance",
  wifi: "provisioning.step.wifi",
  domains: "provisioning.step.domains",
  admin: "provisioning.step.admin",
  review: "provisioning.step.review",
};

export function CreateOrganizationForm() {
  const { t } = useI18n();
  const router = useRouter();
  const create = useCreatePlatformOrganization();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nextBlockers, setNextBlockers] = useState<string[]>([]);
  const activeStep = steps[step];
  const isLast = step === steps.length - 1;
  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  useEffect(() => {
    setNextBlockers(blockersForForm(activeStep, formRef.current ? new FormData(formRef.current) : undefined));
  }, [activeStep]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const form = event.currentTarget;
    const blockers = blockersForForm(activeStep, new FormData(form));
    setNextBlockers(blockers);
    if (!isLast && blockers.length) return;
    if (!isLast) {
      setStep((value) => Math.min(steps.length - 1, value + 1));
      return;
    }
    try {
      const payload = payloadFromForm(new FormData(form));
      const organization = await create.mutateAsync(payload);
      router.push(`/platform/organizations/${organization.id}`);
    } catch (error) {
      setSubmitError(organizationCreateError(error, t));
    }
  }

  return (
    <form
      ref={formRef}
      className="space-y-5"
      onChange={(event) => setNextBlockers(blockersForForm(activeStep, new FormData(event.currentTarget)))}
      onSubmit={submit}
    >
      <section className="ui-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("provisioning.wizard.title")}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{t("provisioning.wizard.description")}</p>
            </div>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--color-muted)]">
              <span>{t(stepKeys[activeStep])}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-surface-muted)]">
              <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {steps.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`rounded-[var(--radius-sm)] border px-3 py-2 text-start text-xs font-semibold ${
                index === step
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]"
              }`}
              onClick={() => setStep(index)}
            >
              {t(stepKeys[item])}
            </button>
          ))}
        </div>
      </section>

      <section className="ui-card p-5">
        {activeStep === "company" ? <CompanyStep /> : null}
        {activeStep === "subscription" ? <SubscriptionStep /> : null}
        {activeStep === "limits" ? <LimitsStep /> : null}
        {activeStep === "offices" ? <OfficeStep /> : null}
        {activeStep === "attendance" ? <AttendanceStep /> : null}
        {activeStep === "wifi" ? <WifiStep /> : null}
        {activeStep === "domains" ? <DomainsStep /> : null}
        {activeStep === "admin" ? <AdminStep /> : null}
        {activeStep === "review" ? <ReviewStep /> : null}
      </section>

      {submitError || create.error ? (
        <FeedbackState tone="error" title={t("organizationCreate.error")} description={submitError ?? create.error?.message} />
      ) : null}

      {nextBlockers.length ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--color-foreground)]">{t("provisioning.missingRequirements")}</p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            {nextBlockers.map((item) => <li key={item}>{t(item)}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button className="ui-button-secondary" disabled={step === 0 || create.isPending} onClick={() => setStep((value) => Math.max(0, value - 1))}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("common.back")}
        </Button>
        <Button disabled={create.isPending || (!isLast && nextBlockers.length > 0)} type="submit" title={!isLast && nextBlockers.length ? t("provisioning.completeRequiredFields") : undefined}>
          {isLast ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              {create.isPending ? t("common.creating") : t("provisioning.createCompany")}
            </>
          ) : (
            <>
              {t("common.next")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function CompanyStep() {
  const { t } = useI18n();
  const countries = useMetadataCountries();
  const currencies = useMetadataCurrencies();
  const languages = useMetadataLanguages();
  const timezones = useMetadataTimezones();
  const organizationTypes = useMetadataOrganizationTypes();
  const organizationTypeOptions = (organizationTypes.data ?? []).filter((option) =>
    isOrganizationTypeCode(option.code),
  );
  return (
    <StepGrid title={t("provisioning.companyInformation")}>
      <Field
        label={t("provisioning.organizationType")}
        name="organizationType"
        kind="select"
        options={organizationTypeOptions.length ? organizationTypeOptions.map((option) => option.code) : [...ORGANIZATION_TYPE_CODES]}
        optionLabel={(option) => {
          const metadata = organizationTypeOptions.find((item) => item.code === option);
          return metadata ? t(metadata.labelKey) : t(`organizationType.${organizationTypeKey(option)}`);
        }}
      />
      <Field label={t("provisioning.legalName")} name="legalName" required />
      <Field label={t("provisioning.displayName")} name="name" required />
      <Field label={t("provisioning.companyCode")} name="companyCode" />
      <Field label={t("provisioning.slug")} name="slug" />
      <Field label={t("provisioning.logo")} name="logoUrl" />
      <MetadataField label={t("provisioning.country")} name="countryCode" options={countries.data} />
      <Field label={t("provisioning.city")} name="city" />
      <MetadataField label={t("provisioning.timezone")} name="timezone" options={timezones.data} defaultValue="Africa/Cairo" />
      <MetadataField label={t("provisioning.currency")} name="defaultCurrency" options={currencies.data} defaultValue="EGP" />
      <MetadataField label={t("provisioning.defaultLanguage")} name="preferredLanguage" options={languages.data} defaultValue="en" />
      <Field label={t("provisioning.status")} name="status" kind="select" options={["DRAFT", "DOCUMENTS_REQUIRED"]} />
      <Field label={t("provisioning.registrationNumber")} name="registrationNumber" />
      <Field label={t("provisioning.commercialRegister")} name="commercialRegisterNumber" />
      <Field label={t("provisioning.taxNumber")} name="taxNumber" />
      <Field label={t("provisioning.vatNumber")} name="vatNumber" />
      <Field label={t("provisioning.businessEmail")} name="businessEmail" type="email" />
      <Field label={t("provisioning.businessPhone")} name="businessPhone" />
      <Field label={t("provisioning.address")} name="address" />
      <Field label={t("provisioning.website")} name="website" />
    </StepGrid>
  );
}

function SubscriptionStep() {
  const { t } = useI18n();
  const plans = usePlatformPlans();
  const planOptions = (plans.data ?? []).filter((plan) => plan.isActive && !plan.isArchived);
  return (
    <StepGrid title={t("provisioning.subscription")}>
      {planOptions.length ? (
        <label className="space-y-2">
          <Label htmlFor="provisioning-planCode">{t("provisioning.plan")}</Label>
          <select id="provisioning-planCode" name="planCode" className="ui-input" defaultValue={planOptions[0]?.code}>
            {planOptions.map((plan) => <option key={plan.id} value={plan.code}>{plan.name}</option>)}
          </select>
        </label>
      ) : (
        <Field label={t("provisioning.plan")} name="planCode" defaultValue="starter" />
      )}
      <Field label={t("provisioning.planName")} name="planName" defaultValue="Starter" />
      <Field label={t("provisioning.subscriptionStart")} name="startsAt" type="date" />
      <Field label={t("provisioning.subscriptionEnd")} name="endsAt" type="date" />
      <Field label={t("provisioning.trialEnd")} name="trialEndsAt" type="date" />
      <Field label={t("common.status")} name="subscriptionStatus" kind="select" options={["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED", "SUSPENDED"]} />
      <Field label={t("provisioning.billingCycle")} name="billingCycle" kind="select" options={["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]} />
      <CheckField label={t("provisioning.autoRenew")} name="autoRenew" />
      <Field label={t("provisioning.internalNotes")} name="notes" />
    </StepGrid>
  );
}

function LimitsStep() {
  const { t } = useI18n();
  return (
    <StepGrid title={t("provisioning.limits")}>
      <Field label={t("provisioning.employeeLimit")} name="maxEmployees" type="number" defaultValue="25" />
      <Field label={t("provisioning.officeLimit")} name="maxOffices" type="number" defaultValue="1" />
      <Field label={t("provisioning.branchLimit")} name="maxBranches" type="number" defaultValue="1" />
      <Field label={t("provisioning.storageLimit")} name="maxStorageMb" type="number" defaultValue="1024" />
      <Field label={t("provisioning.monthlyCheckIns")} name="maxMonthlyCheckIns" type="number" defaultValue="1000" />
      <CheckField label={t("provisioning.allowWebCheckIn")} name="allowWebCheckIn" defaultChecked />
      <CheckField label={t("provisioning.allowMobileCheckIn")} name="allowMobileCheckIn" defaultChecked />
      <CheckField label={t("provisioning.allowPublicWebsite")} name="allowPublicWebsite" defaultChecked />
      <CheckField label={t("provisioning.allowCustomDomain")} name="allowCustomDomain" />
      <CheckField label={t("provisioning.allowSubdomain")} name="allowSubdomain" defaultChecked />
      <CheckField label={t("provisioning.allowDvrReview")} name="allowDvrReview" />
      <CheckField label={t("provisioning.allowFaceVerification")} name="allowFaceVerification" />
    </StepGrid>
  );
}

function OfficeStep() {
  const { t } = useI18n();
  return (
    <StepGrid title={t("provisioning.offices")}>
      <Field label={t("provisioning.officeName")} name="officeName" />
      <Field label={t("provisioning.officeCode")} name="officeCode" />
      <Field label={t("common.type")} name="officeType" kind="select" options={["HEAD_OFFICE", "BRANCH", "SALES_OFFICE", "SITE", "REMOTE_HUB"]} />
      <MapPicker
        addressName="officeAddress"
        latitudeName="officeLatitude"
        longitudeName="officeLongitude"
        exactRadiusName="officeExactRadiusMeters"
        expandedRadiusName="officeExpandedRadiusMeters"
      />
      <CheckField label={t("provisioning.defaultOffice")} name="officeIsDefault" defaultChecked />
    </StepGrid>
  );
}

function AttendanceStep() {
  const { t } = useI18n();
  return (
    <StepGrid title={t("provisioning.attendanceLocations")}>
      <Field label={t("provisioning.locationName")} name="attendanceName" />
      <MapPicker
        addressName="attendanceAddress"
        latitudeName="attendanceLatitude"
        longitudeName="attendanceLongitude"
        exactRadiusName="attendanceExactRadiusMeters"
        expandedRadiusName="attendanceExpandedRadiusMeters"
      />
      <CheckField label={t("provisioning.allowedForWeb")} name="attendanceAllowedForWeb" defaultChecked />
      <CheckField label={t("provisioning.allowedForMobile")} name="attendanceAllowedForMobile" defaultChecked />
      <CheckField label={t("provisioning.reviewOutsideExact")} name="requiresReviewOutsideExactRadius" defaultChecked />
    </StepGrid>
  );
}

function WifiStep() {
  const { t } = useI18n();
  return (
    <StepGrid title={t("provisioning.wifiRules")}>
      <Field label={t("provisioning.wifiName")} name="wifiName" />
      <Field label={t("provisioning.ssid")} name="ssid" />
      <Field label={t("provisioning.bssid")} name="bssid" />
      <Field label={t("provisioning.macAddress")} name="macAddress" />
      <Field label={t("provisioning.appliesTo")} name="appliesTo" kind="select" options={["BOTH", "MOBILE", "WEB"]} />
      <CheckField label={t("provisioning.required")} name="wifiRequired" />
      <Field label={t("provisioning.webWifiPolicy")} name="webWifiPolicy" kind="select" options={["MANUAL_REVIEW", "BLOCK", "IGNORE_FOR_WEB"]} />
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm leading-6 text-[var(--color-muted)] sm:col-span-2 lg:col-span-3">
        {t("provisioning.browserCannotReadWifi")}
      </div>
    </StepGrid>
  );
}

function DomainsStep() {
  const { t } = useI18n();
  return (
    <StepGrid title={t("provisioning.domains")}>
      <Field label={t("provisioning.customDomain")} name="customDomain" />
      <Field label={t("provisioning.redirectMode")} name="redirectMode" kind="select" options={["NONE", "REDIRECT_TO_EXTERNAL", "PROXY_OR_SHOW_COMPANY_PROFILE"]} />
      <Field label={t("provisioning.redirectUrl")} name="redirectUrl" />
      <Field label={t("provisioning.inboundSourceMode")} name="inboundSourceMode" kind="select" options={["NONE", "TRACK_REFERRER", "ACCEPT_LEADS", "WEBHOOK"]} />
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm leading-6 text-[var(--color-muted)] sm:col-span-2 lg:col-span-3">
        {t("provisioning.domainFallbackNote")}
      </div>
    </StepGrid>
  );
}

function AdminStep() {
  const { t } = useI18n();
  return (
    <StepGrid title={t("provisioning.createFirstAdmin")}>
      <Field label={t("provisioning.adminName")} name="adminName" />
      <Field label={t("provisioning.adminEmail")} name="adminEmail" type="email" />
      <Field label={t("provisioning.adminPhoneCountry")} name="adminPhoneCountry" />
      <Field label={t("provisioning.adminPhone")} name="adminPhone" />
      <Field label={t("provisioning.temporaryPassword")} name="temporaryPassword" defaultValue="123456" />
      <Field label={t("provisioning.roleTemplate")} name="roleTemplate" kind="select" options={["company_owner", "company_admin", "hr_manager"]} />
    </StepGrid>
  );
}

function ReviewStep() {
  const { t } = useI18n();
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
      {t("provisioning.reviewCopy")}
    </div>
  );
}

function StepGrid({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  kind,
  options,
  optionLabel,
  required,
  ...inputProps
}: {
  label: string;
  name: string;
  kind?: "select";
  options?: string[];
  optionLabel?: (option: string) => string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="space-y-2">
      <Label htmlFor={`provisioning-${name}`}>{label}</Label>
      {kind === "select" ? (
        <select id={`provisioning-${name}`} name={name} className="ui-input" required={required}>
          {options?.map((option) => (
            <option key={option} value={option}>
              {optionLabel ? optionLabel(option) : option.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ) : (
        <Input id={`provisioning-${name}`} name={name} required={required} {...inputProps} />
      )}
    </label>
  );
}

function MetadataField({ label, name, options, defaultValue }: { label: string; name: string; options?: MetadataOption[]; defaultValue?: string }) {
  return (
    <label className="space-y-2">
      <Label htmlFor={`provisioning-${name}`}>{label}</Label>
      <select id={`provisioning-${name}`} name={name} className="ui-input" defaultValue={defaultValue}>
        <option value="">{label}</option>
        {(options ?? []).map((option) => {
          const value = option.code ?? option.value ?? option.countryCode ?? "";
          return <option key={value} value={value}>{option.label ?? option.name?.en ?? value}</option>;
        })}
      </select>
    </label>
  );
}

function CheckField({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}

function payloadFromForm(data: FormData): PlatformOrganizationInput {
  const officeName = optional(data, "officeName");
  const attendanceName = optional(data, "attendanceName");
  const wifiName = optional(data, "wifiName");
  const customDomain = optional(data, "customDomain");
  const adminEmail = optional(data, "adminEmail");
  const organizationTypeValue = required(data, "organizationType");
  if (!isOrganizationTypeCode(organizationTypeValue)) {
    throw new Error("ORGANIZATION_TYPE_INVALID");
  }
  return {
    name: required(data, "name"),
    organizationType: organizationTypeValue,
    legalName: optional(data, "legalName"),
    tradeName: optional(data, "name"),
    companyCode: optional(data, "companyCode"),
    slug: optional(data, "slug"),
    logoUrl: optional(data, "logoUrl"),
    country: optional(data, "countryCode"),
    countryCode: optional(data, "countryCode"),
    city: optional(data, "city"),
    timezone: optional(data, "timezone"),
    currency: optional(data, "defaultCurrency"),
    defaultCurrency: optional(data, "defaultCurrency"),
    defaultLanguage: optional(data, "preferredLanguage"),
    preferredLanguage: optional(data, "preferredLanguage"),
    status: optional(data, "status"),
    registrationNumber: optional(data, "registrationNumber"),
    commercialRegisterNumber: optional(data, "commercialRegisterNumber"),
    taxNumber: optional(data, "taxNumber"),
    vatNumber: optional(data, "vatNumber"),
    businessEmail: optional(data, "businessEmail"),
    businessPhone: optional(data, "businessPhone"),
    address: optional(data, "address"),
    website: optional(data, "website"),
    webWifiPolicy: optional(data, "webWifiPolicy") as never,
    subscription: {
      planCode: optional(data, "planCode"),
      planName: optional(data, "planName"),
      status: optional(data, "subscriptionStatus") as never,
      startsAt: optional(data, "startsAt"),
      endsAt: optional(data, "endsAt"),
      trialEndsAt: optional(data, "trialEndsAt"),
      billingCycle: optional(data, "billingCycle") as never,
      autoRenew: checked(data, "autoRenew"),
      notes: optional(data, "notes"),
    },
    limits: {
      maxEmployees: numberValue(data, "maxEmployees"),
      maxOffices: numberValue(data, "maxOffices"),
      maxBranches: numberValue(data, "maxBranches"),
      maxStorageMb: numberValue(data, "maxStorageMb"),
      maxMonthlyCheckIns: numberValue(data, "maxMonthlyCheckIns"),
      allowWebCheckIn: checked(data, "allowWebCheckIn"),
      allowMobileCheckIn: checked(data, "allowMobileCheckIn"),
      allowPublicWebsite: checked(data, "allowPublicWebsite"),
      allowCustomDomain: checked(data, "allowCustomDomain"),
      allowSubdomain: checked(data, "allowSubdomain"),
      allowDvrReview: checked(data, "allowDvrReview"),
      allowFaceVerification: checked(data, "allowFaceVerification"),
      enabledModules: { hr: true, crm: true },
    },
    offices: officeName
      ? [{
          name: officeName,
          code: optional(data, "officeCode"),
          type: optional(data, "officeType") as never,
          address: optional(data, "officeAddress"),
          latitude: numberValue(data, "officeLatitude"),
          longitude: numberValue(data, "officeLongitude"),
          exactRadiusMeters: numberValue(data, "officeExactRadiusMeters"),
          expandedRadiusMeters: numberValue(data, "officeExpandedRadiusMeters"),
          isDefault: checked(data, "officeIsDefault"),
        }]
      : [],
    attendanceLocations: attendanceName
      ? [{
          name: attendanceName,
          latitude: numberValue(data, "attendanceLatitude"),
          longitude: numberValue(data, "attendanceLongitude"),
          exactRadiusMeters: numberValue(data, "attendanceExactRadiusMeters"),
          expandedRadiusMeters: numberValue(data, "attendanceExpandedRadiusMeters"),
          allowedForWeb: checked(data, "attendanceAllowedForWeb"),
          allowedForMobile: checked(data, "attendanceAllowedForMobile"),
          requiresReviewOutsideExactRadius: checked(data, "requiresReviewOutsideExactRadius"),
        }]
      : [],
    wifiRules: wifiName
      ? [{
          name: wifiName,
          ssid: optional(data, "ssid"),
          bssid: optional(data, "bssid"),
          macAddress: optional(data, "macAddress"),
          appliesTo: optional(data, "appliesTo") as never,
          isRequired: checked(data, "wifiRequired"),
        }]
      : [],
    domains: customDomain
      ? [{
          domain: customDomain,
          type: "CUSTOM_DOMAIN",
          redirectMode: optional(data, "redirectMode") as never,
          redirectUrl: optional(data, "redirectUrl"),
          inboundSourceMode: optional(data, "inboundSourceMode") as never,
        }]
      : [],
    adminUser: adminEmail
      ? {
          name: optional(data, "adminName"),
          email: adminEmail,
          phoneCountry: optional(data, "adminPhoneCountry"),
          phone: optional(data, "adminPhone"),
          temporaryPassword: optional(data, "temporaryPassword") || "123456",
          roleTemplate: optional(data, "roleTemplate") as never,
        }
      : undefined,
  };
}

function organizationCreateError(error: unknown, t: (key: string) => string) {
  if (error instanceof ApiError && typeof error.details === "object" && error.details) {
    const details = error.details as { code?: unknown };
    if (details.code === "ORGANIZATION_TYPE_INVALID") return t("errors.organizationTypeInvalid");
  }
  if (error instanceof Error && error.message === "ORGANIZATION_TYPE_INVALID") {
    return t("errors.organizationTypeInvalid");
  }
  return error instanceof Error ? error.message : t("organizationCreate.error");
}

function optional(data: FormData, key: string) {
  const value = String(data.get(key) ?? "").trim();
  return value || undefined;
}

function required(data: FormData, key: string) {
  return optional(data, key) ?? "";
}

function numberValue(data: FormData, key: string) {
  const value = optional(data, key);
  return value === undefined ? undefined : Number(value);
}

function checked(data: FormData, key: string) {
  return data.get(key) === "on";
}

function organizationTypeKey(value: string) {
  if (value === "INDIVIDUAL_BROKER") return "individualBroker";
  return value.toLowerCase();
}

function blockersForForm(step: StepId, data?: FormData) {
  if (step !== "company") return [];
  if (!data) return ["provisioning.required.organizationType", "provisioning.required.displayName"];
  const blockers: string[] = [];
  if (!required(data, "organizationType")) blockers.push("provisioning.required.organizationType");
  if (!required(data, "name")) blockers.push("provisioning.required.displayName");
  return blockers;
}
