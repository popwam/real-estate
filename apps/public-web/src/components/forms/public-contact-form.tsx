"use client";

import { FormEvent, useEffect, useState } from "react";
import { FormPrivacyNotice } from "@/components/forms/form-privacy-notice";
import { FormSuccessPlaceholder } from "@/components/forms/form-success-placeholder";
import { isPublicLeadRateLimitError, submitLead } from "@/lib/public-data";
import type {
  PreferredContactMethod,
  SubmitPublicLeadResponse,
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
        eventType: preferredContactMethod === "CHAT" ? "START_CHAT_CLICKED" : "REQUEST_CALL_CLICKED",
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
      setError(
        isPublicLeadRateLimitError(caughtError)
          ? "Too many requests. Please try again shortly."
          : "We could not send your message right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <ContactSuccess
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
    <form onSubmit={handleSubmit} className="grid gap-4 rounded border border-slate-200 bg-white p-6">
      <h3 className="text-2xl font-semibold text-slate-950">Contact</h3>
      <input type="hidden" name="subject" value={subject ?? "Public contact"} />
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Name
        <input name="name" required className="rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Phone
        <input name="phone" required className="rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Email optional
        <input name="email" type="email" className="rounded border border-slate-300 px-3 py-2" />
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-slate-950">
          Preferred contact
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {contactOptions.map((option) => (
            <label
              key={option.value}
              className={`rounded border px-3 py-3 text-sm ${
                preferredContactMethod === option.value
                  ? "border-slate-950 bg-slate-100 text-slate-950"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="preferredContactMethod"
                value={option.value}
                checked={preferredContactMethod === option.value}
                onChange={() => setPreferredContactMethod(option.value)}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Message optional
        <textarea name="message" className="min-h-24 rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          I consent to POPWAM sharing this message with the relevant verified
          organization for follow-up.
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
      {isDev && (
        <pre className="overflow-auto rounded bg-slate-100 p-3 text-xs text-slate-600">
          {JSON.stringify({ utm }, null, 2)}
        </pre>
      )}
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
      >
        {submitting ? "Sending..." : submitLabel(preferredContactMethod)}
      </button>
      <FormPrivacyNotice />
    </form>
  );
}

const contactOptions: Array<{ value: PreferredContactMethod; label: string }> = [
  { value: "CALL", label: "Request Call" },
  { value: "CHAT", label: "Start Chat" },
  { value: "WHATSAPP", label: "WhatsApp" },
];

function submitLabel(method: PreferredContactMethod) {
  if (method === "CALL") return "Request call";
  if (method === "CHAT") return "Start chat";
  return "Contact via WhatsApp";
}

function ContactSuccess({
  response,
  preferredContactMethod,
  fallbackWhatsappUrl,
  copied,
  onCopy,
}: {
  response: SubmitPublicLeadResponse;
  preferredContactMethod: PreferredContactMethod;
  fallbackWhatsappUrl?: string | null;
  copied: boolean;
  onCopy: (value: string) => Promise<void>;
}) {
  const conversationUrl = conversationLink(response);
  const whatsapp = response.contact?.whatsappUrl ?? fallbackWhatsappUrl ?? null;

  if (preferredContactMethod === "CALL") {
    return <FormSuccessPlaceholder title="Your call request was sent" />;
  }

  if (preferredContactMethod === "CHAT") {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="text-lg font-semibold text-emerald-950">
          Your chat request was created.
        </h3>
        {conversationUrl ? (
          <div className="mt-4 grid gap-3">
            {response.isMock && (
              <p className="text-sm text-emerald-800">
                Demo/mock conversation link.
              </p>
            )}
            <a
              href={conversationUrl}
              className="inline-flex rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Open conversation
            </a>
            <button
              type="button"
              onClick={() => onCopy(absoluteUrl(conversationUrl))}
              className="rounded border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            The request was sent. Conversation links depend on the backend returning
            a public share token from lead submission.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded border border-emerald-200 bg-emerald-50 p-5">
      <h3 className="text-lg font-semibold text-emerald-950">
        WhatsApp request received
      </h3>
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Open WhatsApp
        </a>
      ) : (
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          WhatsApp is not configured for this organization yet.
        </p>
      )}
    </div>
  );
}

function conversationLink(response: SubmitPublicLeadResponse) {
  const token = response.conversation?.shareToken ?? response.shareToken;
  const url = response.conversation?.shareUrl ?? response.conversationUrl;

  if (url) return url;
  if (token) return `/c/${token}`;
  return null;
}

function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function optionalString(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue || undefined;
}
