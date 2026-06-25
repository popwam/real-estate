"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { DocumentMetadataList } from "@/components/platform/document-metadata-list";
import { OrganizationInvitationsCard } from "@/components/platform/organization-invitations-card";
import { OrganizationStatusBadge } from "@/components/platform/organization-status-badge";
import { ReviewActionDialog } from "@/components/platform/review-action-dialog";
import { TrustStatusTimeline, trustToneFromStatus } from "@/components/platform/trust-status-timeline";
import { Button } from "@/components/ui/button";
import {
  useApproveOrganization,
  useOrganizationReview,
  useReactivateOrganization,
  useRejectOrganization,
  useSuspendOrganization,
} from "@/hooks/use-platform-admin";
import { formatDate, formatPlainDate } from "@/lib/format";

export default function OrganizationReviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useOrganizationReview(id);
  const approve = useApproveOrganization();
  const reject = useRejectOrganization();
  const suspend = useSuspendOrganization();
  const reactivate = useReactivateOrganization();
  const verifications = data?.verifications ?? [];
  const pendingVerificationCount = verifications.filter((item) =>
    ["PENDING_REVIEW", "UNDER_REVIEW"].includes(item.status),
  ).length;

  if (isLoading) return <LoadingState label="Loading organization review" />;

  if (error) {
    return <FeedbackState tone="error" title="Could not load organization dossier" description={error.message} />;
  }

  if (!data) return null;

  const nextAction = data.status === "PENDING_REVIEW" || pendingVerificationCount
    ? "Review evidence and decide"
    : data.status === "SUSPENDED"
      ? "Resolve suspension or reactivate"
      : "Monitor company readiness";

  return (
    <>
      <PageHeader
        title={data.name}
        description="Review the company profile, submitted evidence, invitations, and trust decisions before changing marketplace access."
        actions={
          <Link className="ui-button ui-button-secondary" href="/platform/organizations">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Organization status</p>
                <div className="mt-2">
                  <OrganizationStatusBadge status={data.status} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Pending documents</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{pendingVerificationCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Company type</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">{data.type.replaceAll("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Next action</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">{nextAction}</p>
              </div>
            </div>
          </section>

          <DetailCard title="Organization Summary">
            <DetailGrid
              items={[
                { label: "Status", value: <OrganizationStatusBadge status={data.status} /> },
                { label: "Type", value: data.type.replaceAll("_", " ") },
                { label: "Plan", value: data.plan ?? "Not set" },
                { label: "Location", value: [data.city, data.country].filter(Boolean).join(", ") || "Not set" },
                { label: "Created", value: formatDate(data.createdAt) },
                { label: "Updated", value: formatDate(data.updatedAt) },
                { label: "Plan expires", value: formatPlainDate(data.planExpiresAt) },
              ]}
            />
          </DetailCard>

          <DetailCard title="Profile">
            <DetailGrid
              items={[
                { label: "Legal name", value: data.profile?.legalName },
                { label: "Trade name", value: data.profile?.tradeName },
                { label: "Commercial registration", value: data.profile?.commercialRegNumber },
                { label: "Tax number", value: data.profile?.taxNumber },
                { label: "Website", value: data.profile?.website },
                { label: "Email", value: data.profile?.email },
                { label: "Phone", value: data.profile?.phone },
                { label: "Address", value: data.profile?.address },
              ]}
            />
          </DetailCard>

          <DetailCard title="Verification documents">
            <DocumentMetadataList documents={verifications} />
          </DetailCard>

          <DetailCard title="Company invitations">
            <OrganizationInvitationsCard id={id} organizationType={data.type} />
          </DetailCard>

          <DetailCard title="Trust timeline">
            <TrustStatusTimeline
              items={verifications.map((item) => ({
                id: item.id,
                title: item.documentType.replaceAll("_", " "),
                status: item.status,
                date: item.verifiedAt ?? item.updatedAt ?? item.createdAt,
                description: item.notes ?? item.rejectionReason ?? undefined,
                tone: trustToneFromStatus(item.status),
              }))}
              emptyText="No document review events have been returned for this organization yet."
            />
          </DetailCard>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <DetailCard title="Review actions">
            <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  These actions change company access and trust state. Use the reason field when rejecting or suspending access.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <ReviewActionDialog
                title="Approve organization"
                description="Approves this organization for platform use based on the currently returned profile and evidence."
                confirmLabel="Approve"
                isPending={approve.isPending}
                error={approve.error}
                onConfirm={(input) => approve.mutateAsync({ id, input })}
                trigger={<Button className="w-full">Approve organization</Button>}
              />
              <ReviewActionDialog
                title="Reject organization"
                description="Rejects the organization review and records the reason for the company."
                confirmLabel="Reject"
                requireReason
                tone="danger"
                isPending={reject.isPending}
                error={reject.error}
                onConfirm={(input) => reject.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90">
                    Reject organization
                  </Button>
                }
              />
              <ReviewActionDialog
                title="Suspend organization"
                description="Suspends marketplace access because of a compliance or operational issue."
                confirmLabel="Suspend"
                requireReason
                tone="warning"
                isPending={suspend.isPending}
                error={suspend.error}
                onConfirm={(input) => suspend.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-warning)] text-[var(--color-warning-foreground)] hover:opacity-90">
                    Suspend organization
                  </Button>
                }
              />
              <ReviewActionDialog
                title="Reactivate organization"
                description="Returns a suspended organization to approved status when the issue is resolved."
                confirmLabel="Reactivate"
                tone="neutral"
                isPending={reactivate.isPending}
                error={reactivate.error}
                onConfirm={(input) => reactivate.mutateAsync({ id, input })}
                trigger={<Button className="ui-button-secondary w-full">Reactivate organization</Button>}
              />
            </div>
          </DetailCard>
        </div>
      </div>
    </>
  );
}
