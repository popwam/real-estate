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
import { useI18n } from "@/i18n";
import {
  useApproveOrganization,
  useOrganizationReview,
  useReactivateOrganization,
  useRejectOrganization,
  useSuspendOrganization,
} from "@/hooks/use-platform-admin";
import { formatDate, formatPlainDate } from "@/lib/format";

export default function OrganizationReviewPage() {
  const { t } = useI18n();
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

  if (isLoading) return <LoadingState label={t("organizationReview.loading")} />;

  if (error) {
    return <FeedbackState tone="error" title={t("organizationReview.error")} description={error.message} />;
  }

  if (!data) return null;

  const nextAction = data.status === "PENDING_REVIEW" || pendingVerificationCount
    ? t("organizationReview.next.review")
    : data.status === "SUSPENDED"
      ? t("organizationReview.next.resolve")
      : t("organizationReview.next.monitor");

  return (
    <>
      <PageHeader
        title={data.name}
        description={t("organizationReview.description")}
        actions={
          <Link className="ui-button ui-button-secondary" href="/platform/organizations">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("common.back")}
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="ui-card p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("organizationReview.status")}</p>
                <div className="mt-2">
                  <OrganizationStatusBadge status={data.status} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("organizationReview.pendingDocuments")}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{pendingVerificationCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("organizationReview.companyType")}</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">{data.type.replaceAll("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("organizationReview.nextAction")}</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">{nextAction}</p>
              </div>
            </div>
          </section>

          <DetailCard title={t("organizationReview.summary")}>
            <DetailGrid
              items={[
                { label: t("common.status"), value: <OrganizationStatusBadge status={data.status} /> },
                { label: t("common.type"), value: data.type.replaceAll("_", " ") },
                { label: t("organizationReview.plan"), value: data.plan ?? t("common.notSet") },
                { label: t("organizationReview.location"), value: [data.city, data.country].filter(Boolean).join(", ") || t("common.notSet") },
                { label: t("common.created"), value: formatDate(data.createdAt) },
                { label: t("common.updated"), value: formatDate(data.updatedAt) },
                { label: t("organizationReview.planExpires"), value: formatPlainDate(data.planExpiresAt) },
              ]}
            />
          </DetailCard>

          <DetailCard title={t("organizationReview.profile")}>
            <DetailGrid
              items={[
                { label: t("organizationReview.legalName"), value: data.profile?.legalName },
                { label: t("organizationReview.tradeName"), value: data.profile?.tradeName },
                { label: t("organizationReview.commercialRegistration"), value: data.profile?.commercialRegNumber },
                { label: t("organizationReview.taxNumber"), value: data.profile?.taxNumber },
                { label: t("organizationReview.website"), value: data.profile?.website },
                { label: t("organizationReview.email"), value: data.profile?.email },
                { label: t("organizationReview.phone"), value: data.profile?.phone },
                { label: t("organizationReview.address"), value: data.profile?.address },
              ]}
            />
          </DetailCard>

          <DetailCard title={t("organizationReview.verificationDocuments")}>
            <DocumentMetadataList documents={verifications} />
          </DetailCard>

          <DetailCard title={t("organizationReview.companyInvitations")}>
            <OrganizationInvitationsCard id={id} organizationType={data.type} />
          </DetailCard>

          <DetailCard title={t("organizationReview.trustTimeline")}>
            <TrustStatusTimeline
              items={verifications.map((item) => ({
                id: item.id,
                title: item.documentType.replaceAll("_", " "),
                status: item.status,
                date: item.verifiedAt ?? item.updatedAt ?? item.createdAt,
                description: item.notes ?? item.rejectionReason ?? undefined,
                tone: trustToneFromStatus(item.status),
              }))}
              emptyText={t("organizationReview.noReviewEvents")}
            />
          </DetailCard>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <DetailCard title={t("organizationReview.actions")}>
            <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  {t("organizationReview.actionsDescription")}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <ReviewActionDialog
                title={t("organizationReview.approveTitle")}
                description={t("organizationReview.approveDescription")}
                confirmLabel={t("common.approve")}
                isPending={approve.isPending}
                error={approve.error}
                onConfirm={(input) => approve.mutateAsync({ id, input })}
                trigger={<Button className="w-full">{t("organizationReview.approveButton")}</Button>}
              />
              <ReviewActionDialog
                title={t("organizationReview.rejectTitle")}
                description={t("organizationReview.rejectDescription")}
                confirmLabel={t("common.reject")}
                requireReason
                tone="danger"
                isPending={reject.isPending}
                error={reject.error}
                onConfirm={(input) => reject.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90">
                    {t("organizationReview.rejectButton")}
                  </Button>
                }
              />
              <ReviewActionDialog
                title={t("organizationReview.suspendTitle")}
                description={t("organizationReview.suspendDescription")}
                confirmLabel={t("common.suspend")}
                requireReason
                tone="warning"
                isPending={suspend.isPending}
                error={suspend.error}
                onConfirm={(input) => suspend.mutateAsync({ id, input })}
                trigger={
                  <Button className="w-full bg-[var(--color-warning)] text-[var(--color-warning-foreground)] hover:opacity-90">
                    {t("organizationReview.suspendButton")}
                  </Button>
                }
              />
              <ReviewActionDialog
                title={t("organizationReview.reactivateTitle")}
                description={t("organizationReview.reactivateDescription")}
                confirmLabel={t("common.reactivate")}
                tone="neutral"
                isPending={reactivate.isPending}
                error={reactivate.error}
                onConfirm={(input) => reactivate.mutateAsync({ id, input })}
                trigger={<Button className="ui-button-secondary w-full">{t("organizationReview.reactivateButton")}</Button>}
              />
            </div>
          </DetailCard>
        </div>
      </div>
    </>
  );
}
