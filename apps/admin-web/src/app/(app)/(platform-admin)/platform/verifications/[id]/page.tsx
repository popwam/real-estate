"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { OrganizationStatusBadge } from "@/components/platform/organization-status-badge";
import { ReviewActionDialog } from "@/components/platform/review-action-dialog";
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
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error.message}
      </p>
    );
  }

  if (!data) return null;

  return (
    <>
      <PageHeader
        title={data.documentType.replaceAll("_", " ")}
        description="Review document metadata, organization context, and platform decision actions."
        actions={
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            href="/platform/verifications"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DetailCard
            title="Verification"
            actions={
              fileUrl ? (
                <a
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
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
                { label: "Expires", value: formatPlainDate(data.expiryDate) },
                { label: "Reviewed", value: formatDate(data.verifiedAt) },
                { label: "Reviewed by", value: data.verifiedBy?.email },
              ]}
            />
            {data.rejectionReason ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {data.rejectionReason}
              </div>
            ) : null}
            {data.notes ? (
              <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
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
                    data.organizationId
                  ),
                },
                { label: "Type", value: data.organization?.type },
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
          <DetailCard title="Document Metadata">
            <DetailGrid
              items={[
                { label: "Uploaded file id", value: data.uploadedFileId },
                { label: "Bucket", value: data.uploadedFile?.bucket },
                { label: "Object key", value: data.uploadedFile?.objectKey },
                { label: "Mime type", value: data.uploadedFile?.mimeType },
                { label: "Size", value: formatBytes(data.uploadedFile?.sizeBytes) },
                { label: "Checksum", value: data.uploadedFile?.checksum },
              ]}
            />
          </DetailCard>
        </div>
        <DetailCard title="Review Actions">
          <div className="space-y-3">
            <ReviewActionDialog
              title="Approve verification"
              description="Approves this document and marks the organization approved."
              confirmLabel="Approve"
              isPending={approve.isPending}
              error={approve.error}
              onConfirm={(input) => approve.mutateAsync({ id, input })}
              trigger={<Button className="w-full">Approve verification</Button>}
            />
            <ReviewActionDialog
              title="Reject verification"
              description="Rejects this document and returns the organization to draft."
              confirmLabel="Reject"
              requireReason
              tone="danger"
              isPending={reject.isPending}
              error={reject.error}
              onConfirm={(input) => reject.mutateAsync({ id, input })}
              trigger={<Button className="w-full bg-red-600 hover:bg-red-700">Reject verification</Button>}
            />
            <ReviewActionDialog
              title="Request more information"
              description="Keeps the document in pending review and records what the organization should provide."
              confirmLabel="Request more"
              requireReason
              tone="warning"
              isPending={requestMore.isPending}
              error={requestMore.error}
              onConfirm={(input) => requestMore.mutateAsync({ id, input })}
              trigger={<Button className="w-full bg-amber-600 hover:bg-amber-700">Request more</Button>}
            />
          </div>
        </DetailCard>
      </div>
    </>
  );
}
