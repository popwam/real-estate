"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, FileCheck2, ShieldCheck } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePlatformOrganization, useMetadataCountries, useMetadataLanguages, useMetadataOrganizationTypes } from "@/hooks/use-platform-admin";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { isOrganizationTypeCode, ORGANIZATION_TYPE_CODES } from "@/lib/organization-types";

export function CreateOrganizationForm() {
  const { t } = useI18n();
  const router = useRouter();
  const create = useCreatePlatformOrganization();
  const countries = useMetadataCountries();
  const languages = useMetadataLanguages();
  const organizationTypes = useMetadataOrganizationTypes();
  const [error, setError] = useState<string | null>(null);
  const organizationTypeOptions = (organizationTypes.data ?? []).filter((option) => option.code && isOrganizationTypeCode(option.code));
  const metadataReady = Boolean(countries.data?.length && languages.data?.length);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const organizationType = String(form.get("organizationType") ?? "");
    if (!isOrganizationTypeCode(organizationType)) {
      setError(t("errors.organizationTypeInvalid"));
      return;
    }
    try {
      const organization = await create.mutateAsync({
        organizationType,
        name: String(form.get("workingName") ?? "").trim(),
        countryCode: String(form.get("countryCode") ?? "").trim(),
        preferredLanguage: String(form.get("preferredLanguage") ?? "en"),
        responsibleSubmitterName: String(form.get("responsibleSubmitterName") ?? "").trim(),
        responsibleSubmitterEmail: String(form.get("responsibleSubmitterEmail") ?? "").trim(),
        responsibleSubmitterPhone: String(form.get("responsibleSubmitterPhone") ?? "").trim(),
        status: "DOCUMENTS_REQUIRED",
      });
      router.push(`/platform/organizations/${organization.id}/documents?onboarding=1`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : t("organizationCreate.error"));
    }
  }

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
    <form className="ui-card space-y-5 p-5" onSubmit={submit}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"><Building2 className="h-5 w-5" /></span>
        <div><p className="text-xs font-bold uppercase text-[var(--color-accent)]">{t("organizationOnboarding.step1")}</p><h2 className="font-semibold text-[var(--color-foreground)]">{t("organizationOnboarding.identityTitle")}</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{t("organizationOnboarding.identityDescription")}</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={t("provisioning.organizationType")} name="organizationType" required options={(organizationTypeOptions.length ? organizationTypeOptions.map((option) => option.code!) : [...ORGANIZATION_TYPE_CODES]).map((value) => ({ value, label: t(`organizationType.${value === "INDIVIDUAL_BROKER" ? "individualBroker" : value.toLowerCase()}`) }))} />
        <Select label={t("provisioning.country")} name="countryCode" required options={(countries.data ?? []).map((option) => ({ value: option.code ?? option.countryCode ?? "", label: option.label ?? option.name?.en ?? option.code ?? "" })).filter((option) => option.value)} />
        <Select label={t("provisioning.defaultLanguage")} name="preferredLanguage" required options={(languages.data ?? []).map((option) => ({ value: option.code ?? option.value ?? "", label: option.label ?? option.name?.en ?? option.code ?? "" })).filter((option) => option.value)} />
        <Field label={t("organizationOnboarding.workingName")} name="workingName" required />
        <Field label={t("organizationOnboarding.submitterName")} name="responsibleSubmitterName" required />
        <Field label={t("organizationOnboarding.submitterEmail")} name="responsibleSubmitterEmail" type="email" required />
        <Field label={t("organizationOnboarding.submitterPhone")} name="responsibleSubmitterPhone" type="tel" />
      </div>
      {!metadataReady && !countries.isLoading && !languages.isLoading ? <FeedbackState tone="error" title={t("organizationOnboarding.metadataRequired")} description={t("organizationOnboarding.metadataRequiredDescription")} action={<Link className="ui-button ui-button-secondary" href="/platform/settings/metadata">{t("organizationOnboarding.manageMetadata")}</Link>} /> : null}
      {error ? <FeedbackState tone="error" title={t("organizationCreate.error")} description={error} /> : null}
      <div className="flex justify-end"><Button type="submit" disabled={create.isPending || !metadataReady}><FileCheck2 className="h-4 w-4" />{create.isPending ? t("common.creating") : t("organizationOnboarding.continueToDocuments")}</Button></div>
    </form>
    <aside className="ui-card h-fit p-5">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" /><h2 className="font-semibold text-[var(--color-foreground)]">{t("organizationOnboarding.documentsNext")}</h2></div>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{t("organizationOnboarding.documentsExplanation")}</p>
      <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-[var(--color-foreground)]">
        <li>{t("organizationOnboarding.commercialRegister")}</li><li>{t("organizationOnboarding.taxCard")}</li><li>{t("organizationOnboarding.ownerIdentity")}</li><li>{t("organizationOnboarding.responsibleIdentity")}</li><li>{t("organizationOnboarding.authorization")}</li>
      </ul>
      <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">{t("organizationOnboarding.laterSetup")}</p>
    </aside>
  </div>;
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return <label className="space-y-2"><Label htmlFor={`organization-${name}`}>{label}</Label><Input id={`organization-${name}`} name={name} type={type} required={required} /></label>;
}

function Select({ label, name, options, required }: { label: string; name: string; options: Array<{ value: string; label: string }>; required?: boolean }) {
  return <label className="space-y-2"><Label htmlFor={`organization-${name}`}>{label}</Label><select id={`organization-${name}`} name={name} className="ui-input" required={required}><option value="">{label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
