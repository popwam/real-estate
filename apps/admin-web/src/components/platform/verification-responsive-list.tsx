"use client";

import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { VerificationStatusBadge } from "@/components/platform/verification-status-badge";
import { formatDate, formatPlainDate } from "@/lib/format";
import type { Verification } from "@/types/platform";

function verificationNextAction(status: string) {
  if (status === "PENDING_REVIEW" || status === "UNDER_REVIEW") return "Review and decide";
  if (status === "REJECTED") return "Waiting for corrected information";
  if (status === "APPROVED") return "No action needed";
  if (status === "EXPIRED") return "Request a fresh document";
  return "Check submission state";
}

export function VerificationResponsiveList({ verifications }: { verifications: Verification[] }) {
  if (!verifications.length) {
    return (
      <EmptyState
        icon={<FileCheck2 className="h-5 w-5" aria-hidden="true" />}
        title="No verification requests waiting for review"
        description="New organization documents will appear here when companies submit them for platform approval."
      />
    );
  }

  return (
    <div className="space-y-3">
      {verifications.map((verification) => (
        <article
          className="ui-card grid gap-4 p-4 transition hover:border-[var(--color-border-strong)] md:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)_auto]"
          key={verification.id}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="text-base font-semibold text-[var(--color-foreground)] hover:underline"
                href={`/platform/verifications/${verification.id}`}
              >
                {verification.documentType.replaceAll("_", " ")}
              </Link>
              <VerificationStatusBadge status={verification.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {verification.organization ? verification.organization.name : "Organization name not returned"}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="font-medium text-[var(--color-foreground)]">Submitted:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(verification.createdAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">Updated:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(verification.updatedAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">Expires:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatPlainDate(verification.expiryDate)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">Reviewed:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(verification.verifiedAt)}</span>
              </p>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Next action</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
              {verificationNextAction(verification.status)}
            </p>
            {verification.notes ? (
              <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{verification.notes}</p>
            ) : null}
          </div>
          <div className="flex items-center md:justify-end">
            <Link
              className="ui-button ui-button-secondary w-full justify-center md:w-auto"
              href={`/platform/verifications/${verification.id}`}
            >
              Review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
