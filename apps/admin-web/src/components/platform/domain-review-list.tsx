"use client";

import { Globe2, ShieldCheck } from "lucide-react";
import { DomainStatusBadge } from "@/components/admin-public/badges";
import { DomainRejectDialog } from "@/components/admin-public/domain-reject-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import type { OrganizationDomain } from "@/types/admin-public";

function domainNextActionKey(domain: OrganizationDomain) {
  if (domain.status === "PENDING") return "domainReview.nextAction.pending";
  if (domain.status === "FAILED") return "domainReview.nextAction.failed";
  return "domainReview.nextAction.none";
}

export function DomainReviewList({
  domains,
  isWorking,
  actionError,
  onApprove,
  onReject,
}: {
  domains: OrganizationDomain[];
  isWorking?: boolean;
  actionError?: Error | null;
  onApprove: (id: string) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
}) {
  const { t } = useI18n();

  if (!domains.length) {
    return (
      <EmptyState
        icon={<Globe2 className="h-5 w-5" aria-hidden="true" />}
        title={t("domainReview.emptyTitle")}
        description={t("domainReview.emptyDescription")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {domains.map((domain) => (
        <article
          key={domain.id}
          className="ui-card grid gap-4 p-4 transition hover:border-[var(--color-border-strong)] lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)_auto]"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-all text-base font-semibold text-[var(--color-foreground)]">{domain.domain}</h2>
              <DomainStatusBadge status={domain.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {domain.type.replaceAll("_", " ")} · {domain.organization?.name ?? "Organization name not returned"}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("domainReview.submitted")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(domain.createdAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("common.updated")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(domain.updatedAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("domainReview.lastDnsCheck")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(domain.lastCheckedAt)}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--color-foreground)]">{t("domainReview.verified")}:</span>{" "}
                <span className="text-[var(--color-muted)]">{formatDate(domain.verifiedAt)}</span>
              </p>
            </div>
            {domain.failureReason || domain.statusNote ? (
              <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
                {domain.failureReason ? <p><span className="font-medium">{t("domainReview.failure")}:</span> {domain.failureReason}</p> : null}
                {domain.statusNote ? <p><span className="font-medium">{t("domainReview.note")}:</span> {domain.statusNote}</p> : null}
              </div>
            ) : null}
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("domainReview.guidance")}</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">{t(domainNextActionKey(domain))}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {t("domainReview.guidanceDescription")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:items-end lg:justify-center">
            <Button
              className="ui-button-secondary w-full lg:w-auto"
              disabled={isWorking || domain.status === "VERIFIED"}
              onClick={() => void onApprove(domain.id)}
            >
              {t("common.approve")}
            </Button>
            <DomainRejectDialog
              error={actionError}
              isPending={isWorking}
              trigger={
                <Button className="w-full bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90 lg:w-auto">
                  {t("common.reject")}
                </Button>
              }
              onConfirm={(reason) => onReject(domain.id, reason)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
