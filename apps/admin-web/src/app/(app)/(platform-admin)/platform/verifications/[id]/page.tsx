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

function formatBytes(value?: number | null) {
  if (!value) return "Unknown size";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useVerification(id);
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const requestMore = useRequestMoreVerification();
  const fileUrl = data?.documentUrl ?? data?.uploadedFile?.url;

  if (isLoading) return <LoadingState label="Loading verification detail" />;

  if (error) {
    return <FeedbackState tone="error" title="Could not load verification detail" description={error.message} />;
  }

  if (!data) return null;

  return (
    <>
      <PageHeader
        title={data.documentType.replaceAll("_", " ")}
        description="Review submitted metadata, company context, and the current decision state before acting."
        actions={
          <Link className="ui-button ui-button-secondary" href="/platform/verifications">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="ui-card p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Decision state</p>
                <div className="mt-2">
                  <VerificationStatusBadge status={data.status} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Organization</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                  {data.organization?.name ?? "Organization name not returned"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Submitted</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">{formatDate(data.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Current action</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                  {["PENDING_REVIEW", "UNDER_REVIEW"].includes(data.status)
                    ? "Approve, reject, or request more information"
                    : "Review the recorded outcome"}
                </p>
              </div>
            </div>
          </section>

          <DetailCard
            title="Verification submission"
            actions={
              fileUrl ? (
                <a
                  className="ui-button ui-button-secondary"
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open file
                </a>
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
                title="Recorded rejection reason"
                description={data.rejectionReason}
              />
            ) : null}
            {data.notes ? (
              <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                {data.notes}
              </div>
            ) : null}
          </DetailCard>

          <DetailCard title="Organization">
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

          <DetailCard title="Document metadata">
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
                <p>No safe file URL was returned, so this UI only shows the submitted metadata.</p>
              </div>
            ) : null}
          </DetailCard>

          <DetailCard title="Decision timeline">
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
          <DetailCard title="Decision actions">
            <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  Decision actions use the existing review contract. Rejection and request-info actions require a reason.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <ReviewActionDialog
                title="Approve verification"
                description="Approves this submitted verification record using the current evidence returned by the API."
                confirmLabel="Approve"
                isPending={approve.isPending}
                error={approve.error}
                onConfirm={(input) => approve.mutateAsync({ id, input })}
                trigger={<Button className="w-full">Approve verification</Button>}
              />
              <ReviewActionDialog
                title="Reject verification"
                description="Rejects this document and records a reason for the organization to correct."
                confirmLabel="Reject"
                requireReason
                tone="danger"
                isPending={reject.isPending}
                error={reject.error}
                onConfirm={(input) => reject.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90">
                    Reject verification
                  </Button>
                }
              />
              <ReviewActionDialog
                title="Request more information"
                description="Keeps the document in review and records what the organization should provide next."
                confirmLabel="Request more"
                requireReason
                tone="warning"
                isPending={requestMore.isPending}
                error={requestMore.error}
                onConfirm={(input) => requestMore.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-warning)] text-[var(--color-warning-foreground)] hover:opacity-90">
                    Request more
                  </Button>
                }
              />
            </div>
          </DetailCard>
        </div>
      </div>
    </>
  );
}
