"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_WEB_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_WEB_BASE_URL?.replace(/\/$/, "");

export function ConversationShareLinkBox({ shareToken }: { shareToken?: string | null }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (!shareToken) return null;
    return PUBLIC_WEB_BASE_URL ? `${PUBLIC_WEB_BASE_URL}/c/${shareToken}` : `/c/${shareToken}`;
  }, [shareToken]);

  if (!shareToken || !shareUrl) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
        No public share token is available for this conversation.
      </div>
    );
  }

  async function copyLink() {
    const absoluteUrl =
      shareUrl?.startsWith("http") || typeof window === "undefined"
        ? shareUrl
        : `${window.location.origin}${shareUrl}`;
    if (!absoluteUrl) return;
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
  }

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Public conversation link</p>
        <p className="mt-1 break-all text-sm text-zinc-900">{shareUrl}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="gap-2" onClick={copyLink}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          href={shareUrl}
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Open
        </Link>
      </div>
      {!PUBLIC_WEB_BASE_URL ? (
        <p className="text-xs text-zinc-500">
          Using local `/c/[token]` fallback. Set `NEXT_PUBLIC_PUBLIC_WEB_BASE_URL` when Admin Web and Public Web run on different hosts.
        </p>
      ) : null}
    </div>
  );
}
