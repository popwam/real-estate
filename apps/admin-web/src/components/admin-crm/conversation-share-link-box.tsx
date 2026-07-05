"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { useI18n } from "@/i18n";

const PUBLIC_WEB_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_WEB_BASE_URL?.replace(/\/$/, "");

export function ConversationShareLinkBox({ shareToken }: { shareToken?: string | null }) {
  const { t } = useI18n();

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string>();
  const shareUrl = useMemo(() => !shareToken ? null : PUBLIC_WEB_BASE_URL ? `${PUBLIC_WEB_BASE_URL}/c/${shareToken}` : `/c/${shareToken}`, [shareToken]);

  if (!shareUrl) return <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm leading-6 text-[var(--color-muted)]">{t("adminSweep.no.private.share.link.is.available.for.this.conv.4db68641")}</div>;

  async function copyLink() {
    const absoluteUrl = shareUrl?.startsWith("http") || typeof window === "undefined" ? shareUrl : `${window.location.origin}${shareUrl}`;
    if (!absoluteUrl) return;
    try { await navigator.clipboard.writeText(absoluteUrl); setCopied(true); setCopyError(undefined); } catch { setCopyError("The browser could not copy this link. Open it and copy the address manually."); }
  }

  return <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"><div className="flex gap-3"><Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden="true" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("adminSweep.private.client.link.b04cecc1")}</p><p className="mt-1 truncate text-sm text-[var(--color-foreground)]" title={shareUrl}>{shareUrl}</p></div></div><div className="flex flex-wrap gap-2"><button type="button" className="ui-button ui-button-primary" onClick={copyLink}><Copy className="h-4 w-4" aria-hidden="true" />{copied ? "Copied" : "Copy link"}</button><Link className="ui-button ui-button-secondary" href={shareUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />{t("adminSweep.open.link.d2de1a28")}</Link></div>{copyError ? <FeedbackState tone="error" title={t("adminSweep.link.could.not.be.copied.a39c9833")} description={copyError} /> : null}<p className="text-xs leading-5 text-[var(--color-muted)]">{t("adminSweep.share.only.with.the.intended.client.anyone.holdi.43d0fa66")}</p></div>;
}
