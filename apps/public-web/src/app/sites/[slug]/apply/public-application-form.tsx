"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/i18n";
import { submitPublicApplication } from "@/lib/public-api";

type PublicApplicationFormProps = {
  slug: string;
  jobId?: string;
};

export function PublicApplicationForm({ slug, jobId }: PublicApplicationFormProps) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);
    if (jobId) formData.set("jobOpeningId", jobId);
    try {
      const result = await submitPublicApplication(slug, formData);
      setMessage(`${t("careers.applicationSubmitted")} ${result.id}`);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("careers.applicationFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:grid-cols-2" onSubmit={submit}>
      <Field name="fullName" label={t("careers.fullName")} required />
      <Field name="email" label={t("careers.email")} type="email" />
      <Field name="phoneCountry" label={t("careers.phoneCountry")} />
      <Field name="phone" label={t("careers.phone")} />
      <Field name="nationalityCountryCode" label={t("careers.nationality")} />
      <Field name="preferredLanguage" label={t("careers.preferredLanguage")} />
      <Field name="lastSalaryAmount" label={t("careers.lastSalary")} type="number" />
      <Field name="lastSalaryCurrency" label={t("careers.lastSalaryCurrency")} />
      <Field name="linkedinUrl" label={t("careers.linkedin")} />
      <Field name="portfolioUrl" label={t("careers.portfolio")} />
      <FileField name="cv" label={t("careers.cv")} />
      <FileField name="graduationCertificate" label={t("careers.graduationCertificate")} />
      <FileField name="nationalIdFront" label={t("careers.nationalIdFront")} />
      <FileField name="nationalIdBack" label={t("careers.nationalIdBack")} />
      <FileField name="militaryCertificate" label={t("careers.militaryCertificate")} />
      <FileField name="lastSalaryProof" label={t("careers.lastSalaryProof")} />
      <label className="grid gap-1.5 md:col-span-2">
        <span className="text-sm font-medium">{t("careers.notes")}</span>
        <textarea name="notes" className="min-h-24 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
      </label>
      <label className="flex gap-2 text-sm md:col-span-2">
        <input name="consent" value="true" type="checkbox" required />
        <span>{t("careers.consent")}</span>
      </label>
      <div className="md:col-span-2">
        <button className="ui-button ui-button-primary" disabled={pending}>{pending ? t("careers.submitting") : t("careers.submitApplication")}</button>
      </div>
      {message ? <p className="text-sm font-medium text-emerald-600 md:col-span-2">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600 md:col-span-2">{error}</p> : null}
    </form>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input name={name} type={type} required={required} className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" />
    </label>
  );
}

function FileField({ name, label }: { name: string; label: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input name={name} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" />
    </label>
  );
}
