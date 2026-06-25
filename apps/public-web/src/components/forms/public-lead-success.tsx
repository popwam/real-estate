"use client";

import type {
  PreferredContactMethod,
  SubmitPublicLeadResponse,
} from "@/lib/public-api";
import { useI18n } from "@/i18n";

type PublicLeadSuccessProps = {
  response: SubmitPublicLeadResponse;
  preferredContactMethod: PreferredContactMethod;
  fallbackWhatsappUrl?: string | null;
  copied: boolean;
  onCopy: (value: string) => Promise<void>;
};

export function PublicLeadSuccess({
  response,
  preferredContactMethod,
  fallbackWhatsappUrl,
  copied,
  onCopy,
}: PublicLeadSuccessProps) {
  const { t } = useI18n();
  const conversationUrl = conversationLink(response);
  const whatsapp = response.contact?.whatsappUrl ?? fallbackWhatsappUrl ?? null;

  if (preferredContactMethod === "CHAT" && conversationUrl) {
    return (
      <div className="ui-feedback ui-feedback-success p-5" role="status">
        <h3 className="text-lg font-semibold">{t("lead.success.conversationReady")}</h3>
        <p className="mt-2 text-sm leading-6">
          {t("lead.success.conversationBody")}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a href={conversationUrl} className="ui-button ui-button-primary">
            {t("lead.success.openConversation")}
          </a>
          <button
            type="button"
            onClick={() => onCopy(absoluteUrl(conversationUrl))}
            className="ui-button ui-button-secondary"
          >
            {copied ? t("lead.success.linkCopied") : t("lead.success.copyLink")}
          </button>
        </div>
      </div>
    );
  }

  if (preferredContactMethod === "WHATSAPP" && whatsapp) {
    return (
      <div className="ui-feedback ui-feedback-success p-5" role="status">
        <h3 className="text-lg font-semibold">{t("lead.success.requestSent")}</h3>
        <p className="mt-2 text-sm leading-6">
          {t("lead.success.whatsappBody")}
        </p>
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="ui-button ui-button-primary mt-4"
        >
          {t("lead.success.openWhatsapp")}
        </a>
      </div>
    );
  }

  return (
    <div className="ui-feedback ui-feedback-success p-5" role="status">
      <h3 className="text-lg font-semibold">{t("lead.success.requestSent")}</h3>
      <p className="mt-2 text-sm leading-6">
        {t("lead.success.defaultBody")}
      </p>
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
