"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PublicBottomNav } from "@/components/public/public-bottom-nav";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";

const marketplaceSegments = new Set([
  "projects",
  "developers",
  "brokerages",
  "landing",
  "c",
]);

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const isPrivateConversation = firstSegment === "c";
  const isOrganizationSite = Boolean(
    firstSegment && !marketplaceSegments.has(firstSegment),
  );
  const isCampaignLanding = firstSegment === "landing";

  if (isOrganizationSite) {
    return <>{children}</>;
  }

  if (isPrivateConversation) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-[var(--color-foreground)]" aria-label="POPWAM home">
              <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-xs text-[var(--color-primary-foreground)]">P</span>
              POPWAM
            </Link>
            <span className="ui-badge" aria-label="Private conversation link">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
              Private conversation
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <PublicHeader />
      <main
        className={
          isCampaignLanding
            ? "flex-1"
            : "flex-1 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] md:pb-0"
        }
      >
        {children}
      </main>
      <PublicFooter />
      {isCampaignLanding ? null : <PublicBottomNav />}
    </div>
  );
}
