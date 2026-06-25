"use client";

import { FormEvent, useEffect, useState } from "react";
import { FormPrivacyNotice } from "@/components/forms/form-privacy-notice";
import { PublicLeadSuccess } from "@/components/forms/public-lead-success";
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
  const [submitted, setSubmitted] = useState<SubmitPublicLeadResponse | null>(null);
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<PreferredContactMethod>("CALL");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utm, setUtm] = useState<CapturedUtmParams>({});
  const contactOptions = buildContactOptions(Boolean(whatsappUrl));
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
      setError(publicLeadErrorMessage(caughtError));
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
          Contact the team
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Share your details and the team will respond through your preferred
          contact method.
        </p>
      </div>
      <input type="hidden" name="subject" value={subject ?? "Public contact"} />
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        Full name
        <input name="name" required className="ui-input" autoComplete="name" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        Phone number
        <input name="phone" required className="ui-input" autoComplete="tel" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        Email <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        <input name="email" type="email" className="ui-input" autoComplete="email" />
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">
          Preferred contact
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
        Message <span className="font-normal text-[var(--color-muted)]">(optional)</span>
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
          I agree that POPWAM may share this message with the relevant
          organization so they can follow up.
        </span>
      </label>
      <div className="sr-only" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label>
          Company website
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
        {submitting ? "Sending..." : submitLabel(preferredContactMethod)}
      </button>
      <FormPrivacyNotice />
    </form>
  );
}

function buildContactOptions(includeWhatsapp: boolean) {
  const options: Array<{ value: PreferredContactMethod; label: string }> = [
    { value: "CALL", label: "Request a call" },
    { value: "CHAT", label: "Message online" },
  ];

  if (includeWhatsapp) {
    options.push({ value: "WHATSAPP", label: "WhatsApp" });
  }

  return options;
}

function submitLabel(method: PreferredContactMethod) {
  if (method === "CALL") return "Request a call";
  if (method === "CHAT") return "Send message";
  return "Continue with WhatsApp";
}

function publicLeadErrorMessage(error: unknown) {
  if (isPublicLeadRateLimitError(error)) {
    return "Too many requests were sent from this browser. Please try again shortly.";
  }

  if (error instanceof PublicApiError && (error.status === 400 || error.status === 422)) {
    return "Please check the required details and try again.";
  }

  return "We could not send your message right now. Please try again.";
}

function optionalString(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue || undefined;
}
