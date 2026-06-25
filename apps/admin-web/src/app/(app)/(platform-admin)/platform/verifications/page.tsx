"use client";

import { FileCheck2 } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { VerificationResponsiveList } from "@/components/platform/verification-responsive-list";
import { useVerificationQueue } from "@/hooks/use-platform-admin";

export default function PlatformVerificationsPage() {
  const { data = [], isLoading, error } = useVerificationQueue();

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Review submitted organization documents and make clear approve, reject, or request-info decisions."
      />
      <section className="ui-card mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Review queue</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {data.length ? `${data.length} verification request${data.length === 1 ? "" : "s"} loaded.` : "No verification requests waiting for review."}
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No risk score or document preview is shown unless returned by the existing API.
          </p>
        </div>
      </section>
      {isLoading ? <LoadingState label="Loading verification queue" /> : null}
      {error ? (
        <FeedbackState tone="error" title="Could not load verification queue" description={error.message} />
      ) : null}
      {!isLoading && !error ? (
        <VerificationResponsiveList verifications={data} />
      ) : null}
    </>
  );
}
