"use client";

import { Globe2 } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DomainReviewList } from "@/components/platform/domain-review-list";
import { useApprovePlatformDomain, usePlatformDomains, useRejectPlatformDomain } from "@/hooks/use-admin-public";
import { useI18n } from "@/i18n";

export function PlatformDomainsPageContent() {
  const { t } = useI18n();

  const { data = [], isLoading, error } = usePlatformDomains();
  const approve = useApprovePlatformDomain();
  const reject = useRejectPlatformDomain();
  const actionError = approve.error ?? reject.error;

  return (
    <>
      <PageHeader
        title={t("adminSweep.domain.review.4106ed98")}
        description="Review organization domain records, approval state, and returned DNS evidence before allowing public use."
      />
      <section className="ui-card mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Globe2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("adminSweep.domain.governance.queue.62bf9a61")}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {data.length ? `${data.length} domain record${data.length === 1 ? "" : "s"} loaded.` : "No domain records waiting for review."}
              </p>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--color-muted)]">{t("adminSweep.approve.or.reject.using.only.the.returned.domain.4c32e66c")}</p>
        </div>
      </section>
      {isLoading ? <LoadingState label="Loading domain records" /> : null}
      {error ? (
        <FeedbackState tone="error" title={t("adminSweep.could.not.load.domain.review.queue.726facc7")} description={error.message} />
      ) : null}
      {!isLoading && !error ? (
        <DomainReviewList
          actionError={actionError}
          domains={data}
          isWorking={approve.isPending || reject.isPending}
          onApprove={(id) => approve.mutateAsync(id)}
          onReject={(id, reason) => reject.mutateAsync({ id, input: { reason } })}
        />
      ) : null}
    </>
  );
}
