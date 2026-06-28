"use client";

import { FormEvent, useEffect, useState } from "react";
import { FormPrivacyNotice } from "@/components/forms/form-privacy-notice";
import { PublicLeadSuccess } from "@/components/forms/public-lead-success";
import { useI18n } from "@/i18n";
import { isPublicLeadRateLimitError, submitLead } from "@/lib/public-data";
import {
  PublicApiError,
  type PreferredContactMethod,
  type SubmitPublicLeadResponse,
} from "@/lib/public-api";
import {
  captureUtmFromCurrentUrl,
  type CapturedUtmParams,
} from "@/lib/utm-capture";
import { ensureVisitorSession, trackPublicEvent } from "@/lib/visitor-tracking";

const isDev = process.env.NODE_ENV === "development";

export function PublicContactForm({
  subject,
  organizationSlug,
  projectSlug,
  whatsappUrl,
}: {
  subject?: string;
  organizationSlug?: string;
  projectSlug?: string;
  whatsappUrl?: string | null;
}) {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState<SubmitPublicLeadResponse | null>(null);
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<PreferredContactMethod>("CALL");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utm, setUtm] = useState<CapturedUtmParams>({});
  const contactOptions = buildContactOptions(Boolean(whatsappUrl), t);
  const errorId = projectSlug ? `${projectSlug}-contact-error` : "public-contact-error";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setUtm(captureUtmFromCurrentUrl());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const message = [
        optionalString(formData.get("subject")),
        optionalString(formData.get("message")),
      ]
        .filter(Boolean)
        .join("\n\n");
      const visitorContext = await ensureVisitorSession(projectSlug);

      trackPublicEvent({
        eventType:
          preferredContactMethod === "CHAT"
            ? "START_CHAT_CLICKED"
            : "REQUEST_CALL_CLICKED",
        projectSlug,
      });

      const response = await submitLead({
        organizationSlug,
        projectSlug,
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: optionalString(formData.get("email")),
        message: message || undefined,
        website: optionalString(formData.get("website")),
        companyWebsite: optionalString(formData.get("companyWebsite")),
        sourcePage:
          typeof window === "undefined"
            ? undefined
            : `${window.location.pathname}${window.location.search}`,
        utm,
        preferredContactMethod,
        consent: formData.get("consent") === "on",
        visitorId: visitorContext?.visitorId,
        visitorSessionId: visitorContext?.sessionId,
      });

      if (isDev) {
        console.info("POPWAM public contact form submitted", {
          projectSlug,
          preferredContactMethod,
          hasVisitorContext: Boolean(visitorContext),
        });
      }

      setSubmitted(response);

      const safeWhatsAppUrl =
        preferredContactMethod === "WHATSAPP"
          ? response.contact?.whatsappUrl ?? whatsappUrl ?? null
          : null;
      if (safeWhatsAppUrl && typeof window !== "undefined") {
        window.open(safeWhatsAppUrl, "_blank", "noopener,noreferrer");
      }
    } catch (caughtError) {
      setError(publicLeadErrorMessage(caughtError, t));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <PublicLeadSuccess
        response={submitted}
        preferredContactMethod={preferredContactMethod}
        fallbackWhatsappUrl={whatsappUrl}
        copied={copied}
        onCopy={async (value) => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ui-card grid gap-4 p-6"
      aria-describedby={error ? errorId : undefined}
    >
      <div>
        <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
          {t("lead.contactTeam")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {t("lead.contactTeamDescription")}
        </p>
      </div>
      <input type="hidden" name="subject" value={subject ?? t("lead.publicContactSubject")} />
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        {t("lead.fullName")}
        <input name="name" required className="ui-input" autoComplete="name" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        {t("lead.phone")}
        <input name="phone" required className="ui-input" autoComplete="tel" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        {t("lead.email")} <span className="font-normal text-[var(--color-muted)]">{t("lead.optionalSuffix")}</span>
        <input name="email" type="email" className="ui-input" autoComplete="email" />
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">
          {t("lead.preferredContact")}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {contactOptions.map((option) => (
            <label
              key={option.value}
              className={[
                "rounded-[var(--radius-md)] border px-3 py-3 text-sm font-semibold transition",
                preferredContactMethod === option.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-foreground)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]",
              ].join(" ")}
            >
              <input
                type="radio"
                name="preferredContactMethod"
                value={option.value}
                checked={preferredContactMethod === option.value}
                onChange={() => setPreferredContactMethod(option.value)}
                className="me-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        {t("lead.message")} <span className="font-normal text-[var(--color-muted)]">{t("lead.optionalSuffix")}</span>
        <textarea name="message" className="ui-input" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-muted)]">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-[var(--color-border-strong)]"
        />
        <span>
          {t("lead.messageConsent")}
        </span>
      </label>
      <div className="sr-only" aria-hidden="true">
        <label>
          {t("lead.website")}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label>
          {t("lead.companyWebsite")}
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error ? (
        <p id={errorId} className="ui-feedback ui-feedback-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="ui-button ui-button-primary w-full"
      >
        {submitting ? t("lead.sending") : submitLabel(preferredContactMethod, t)}
      </button>
      <FormPrivacyNotice />
    </form>
  );
}

function buildContactOptions(includeWhatsapp: boolean, t: (key: string) => string) {
  const options: Array<{ value: PreferredContactMethod; label: string }> = [
    { value: "CALL", label: t("lead.requestCall") },
    { value: "CHAT", label: t("lead.messageOnline") },
  ];

  if (includeWhatsapp) {
    options.push({ value: "WHATSAPP", label: t("lead.whatsapp") });
  }

  return options;
}

function submitLabel(method: PreferredContactMethod, t: (key: string) => string) {
  if (method === "CALL") return t("lead.requestCall");
  if (method === "CHAT") return t("lead.sendMessage");
  return t("lead.continueWhatsapp");
}

function publicLeadErrorMessage(error: unknown, t: (key: string) => string) {
  if (isPublicLeadRateLimitError(error)) {
    return t("lead.error.rateLimit");
  }

  if (error instanceof PublicApiError && (error.status === 400 || error.status === 422)) {
    return t("lead.error.validation");
  }

  return t("lead.error.messageGeneric");
}

function optionalString(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue || undefined;
}
