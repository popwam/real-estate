"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { OrganizationStatusBadge } from "@/components/platform/organization-status-badge";
import { ReviewActionDialog } from "@/components/platform/review-action-dialog";
import { TrustStatusTimeline, trustToneFromStatus } from "@/components/platform/trust-status-timeline";
import { VerificationStatusBadge } from "@/components/platform/verification-status-badge";
import { Button } from "@/components/ui/button";
import {
  useApproveVerification,
  useRejectVerification,
  useRequestMoreVerification,
  useVerification,
} from "@/hooks/use-platform-admin";
import { formatDate, formatPlainDate } from "@/lib/format";
import { useI18n } from "@/i18n";

function formatBytes(value?: number | null) {
  if (!value) return "Unknown size";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VerificationDetailPage() {
  const { t } = useI18n();

  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useVerification(id);
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const requestMore = useRequestMoreVerification();
  const fileUrl = data?.documentUrl ?? data?.uploadedFile?.url;

  if (isLoading) return <LoadingState label="Loading verification detail" />;

  if (error) {
    return <FeedbackState tone="error" title={t("adminSweep.could.not.load.verification.detail.4d267f89")} description={error.message} />;
  }

  if (!data) return null;

  return (
    <>
      <PageHeader
        title={data.documentType.replaceAll("_", " ")}
        description="Review submitted metadata, company context, and the current decision state before acting."
        actions={
          <Link className="ui-button ui-button-secondary" href="/platform/verifications">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("adminSweep.back.b52b36b7")}</Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="ui-card p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("adminSweep.decision.state.69f82c18")}</p>
                <div className="mt-2">
                  <VerificationStatusBadge status={data.status} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("adminSweep.organization.519255ae")}</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                  {data.organization?.name ?? "Organization name not returned"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("adminSweep.submitted.2e00359b")}</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">{formatDate(data.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("adminSweep.current.action.3866f821")}</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                  {["PENDING_REVIEW", "UNDER_REVIEW"].includes(data.status)
                    ? "Approve, reject, or request more information"
                    : "Review the recorded outcome"}
                </p>
              </div>
            </div>
          </section>

          <DetailCard
            title={t("adminSweep.verification.submission.a5723b3a")}
            actions={
              fileUrl ? (
                <a
                  className="ui-button ui-button-secondary"
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />{t("adminSweep.open.file.f11b8781")}</a>
              ) : null
            }
          >
            <DetailGrid
              items={[
                { label: "Status", value: <VerificationStatusBadge status={data.status} /> },
                { label: "Document type", value: data.documentType.replaceAll("_", " ") },
                { label: "Submitted", value: formatDate(data.createdAt) },
                { label: "Updated", value: formatDate(data.updatedAt) },
                { label: "Expires", value: formatPlainDate(data.expiryDate) },
                { label: "Reviewed", value: formatDate(data.verifiedAt) },
                { label: "Reviewed by", value: data.verifiedBy?.email },
              ]}
            />
            {data.rejectionReason ? (
              <FeedbackState
                className="mt-5"
                tone="error"
                title={t("adminSweep.recorded.rejection.reason.db01a47b")}
                description={data.rejectionReason}
              />
            ) : null}
            {data.notes ? (
              <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                {data.notes}
              </div>
            ) : null}
          </DetailCard>

          <DetailCard title={t("adminSweep.organization.519255ae")}>
            <DetailGrid
              items={[
                {
                  label: "Name",
                  value: data.organization ? (
                    <Link className="font-medium hover:underline" href={`/platform/organizations/${data.organization.id}`}>
                      {data.organization.name}
                    </Link>
                  ) : (
                    "Organization name not returned"
                  ),
                },
                { label: "Type", value: data.organization?.type?.replaceAll("_", " ") },
                {
                  label: "Status",
                  value: data.organization?.status ? (
                    <OrganizationStatusBadge status={data.organization.status} />
                  ) : undefined,
                },
                { label: "Location", value: [data.organization?.city, data.organization?.country].filter(Boolean).join(", ") || "Not set" },
                { label: "Plan", value: data.organization?.plan },
                { label: "Profile email", value: data.organization?.profile?.email },
              ]}
            />
          </DetailCard>

          <DetailCard title={t("adminSweep.document.metadata.a5c99d4e")}>
            <DetailGrid
              items={[
                { label: "File reference", value: data.uploadedFileId ? "Returned by API" : "No file reference returned" },
                { label: "Bucket", value: data.uploadedFile?.bucket },
                { label: "Object key", value: data.uploadedFile?.objectKey },
                { label: "Mime type", value: data.uploadedFile?.mimeType },
                { label: "Size", value: formatBytes(data.uploadedFile?.sizeBytes) },
                { label: "Checksum", value: data.uploadedFile?.checksum ? "Returned" : "Not returned" },
              ]}
            />
            {!fileUrl ? (
              <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{t("adminSweep.no.safe.file.url.was.returned.so.this.ui.only.sh.9f27bad8")}</p>
              </div>
            ) : null}
          </DetailCard>

          <DetailCard title={t("adminSweep.decision.timeline.2c6215a3")}>
            <TrustStatusTimeline
              items={[
                {
                  id: data.id,
                  title: data.documentType.replaceAll("_", " "),
                  status: data.status,
                  date: data.verifiedAt ?? data.updatedAt ?? data.createdAt,
                  description: data.rejectionReason ?? data.notes ?? undefined,
                  tone: trustToneFromStatus(data.status),
                },
              ]}
            />
          </DetailCard>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <DetailCard title={t("adminSweep.decision.actions.d292fb97")}>
            <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
                <p className="text-sm leading-6 text-[var(--color-muted)]">{t("adminSweep.decision.actions.use.the.existing.review.contrac.8c5ad529")}</p>
              </div>
            </div>
            <div className="space-y-3">
              <ReviewActionDialog
                title={t("adminSweep.approve.verification.82c4bdf0")}
                description="Approves this submitted verification record using the current evidence returned by the API."
                confirmLabel="Approve"
                isPending={approve.isPending}
                error={approve.error}
                onConfirm={(input) => approve.mutateAsync({ id, input })}
                trigger={<Button className="w-full">{t("adminSweep.approve.verification.82c4bdf0")}</Button>}
              />
              <ReviewActionDialog
                title={t("adminSweep.reject.verification.bd34e6b1")}
                description="Rejects this document and records a reason for the organization to correct."
                confirmLabel="Reject"
                requireReason
                tone="danger"
                isPending={reject.isPending}
                error={reject.error}
                onConfirm={(input) => reject.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90">{t("adminSweep.reject.verification.bd34e6b1")}</Button>
                }
              />
              <ReviewActionDialog
                title={t("adminSweep.request.more.information.1cd0f07e")}
                description="Keeps the document in review and records what the organization should provide next."
                confirmLabel="Request more"
                requireReason
                tone="warning"
                isPending={requestMore.isPending}
                error={requestMore.error}
                onConfirm={(input) => requestMore.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-warning)] text-[var(--color-warning-foreground)] hover:opacity-90">{t("adminSweep.request.more.7ea2c5d1")}</Button>
                }
              />
            </div>
          </DetailCard>
        </div>
      </div>
    </>
  );
}
