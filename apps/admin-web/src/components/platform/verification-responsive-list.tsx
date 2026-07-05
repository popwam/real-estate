"use client";

import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { VerificationStatusBadge } from "@/components/platform/verification-status-badge";
import { useI18n } from "@/i18n";
import { formatDate, formatPlainDate } from "@/lib/format";
import type { Verification } from "@/types/platform";

function verificationNextActionKey(status: string) {
  if (status === "PENDING_REVIEW" || status === "UNDER_REVIEW") return "verificationList.nextAction.review";
  if (status === "REJECTED") return "verificationList.nextAction.corrected";
  if (status === "APPROVED") return "verificationList.nextAction.none";
  if (status === "EXPIRED") return "verificationList.nextAction.fresh";
  return "verificationList.nextAction.check";
}

export function VerificationResponsiveList({ verifications }: { verifications: Verification[] }) {
  const { t } = useI18n();

  if (!verifications.length) {
    return (
      <EmptyState
        icon={<FileCheck2 className="h-5 w-5" aria-hidden="true" />}
        title={t("verificationList.emptyTitle")}
        description={t("verificationList.emptyDescription")}
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
              {verification.organization ? verification.organization.name : t("domainReview.organizationNameMissing")}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("domainReview.submitted")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(verification.createdAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("common.updated")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(verification.updatedAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("verificationList.expires")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatPlainDate(verification.expiryDate)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("verificationList.reviewed")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(verification.verifiedAt)}</span>
              </p>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("verificationList.nextAction")}</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
              {t(verificationNextActionKey(verification.status))}
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
              {t("verificationList.review")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
