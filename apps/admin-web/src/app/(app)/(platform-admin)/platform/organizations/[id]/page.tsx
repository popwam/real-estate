"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { DocumentMetadataList } from "@/components/platform/document-metadata-list";
import { OrganizationStatusBadge } from "@/components/platform/organization-status-badge";
import { ReviewActionDialog } from "@/components/platform/review-action-dialog";
import { Button } from "@/components/ui/button";
import {
  useApproveOrganization,
  useOrganizationReview,
  useReactivateOrganization,
  useRejectOrganization,
  useSuspendOrganization,
} from "@/hooks/use-platform-admin";
import { formatDate, formatPlainDate } from "@/lib/format";
import { OrganizationInvitationsCard } from "@/components/platform/organization-invitations-card";

export default function OrganizationReviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useOrganizationReview(id);
  const approve = useApproveOrganization();
  const reject = useRejectOrganization();
  const suspend = useSuspendOrganization();
  const reactivate = useReactivateOrganization();
  const verifications = data?.verifications ?? [];

  if (isLoading) return <LoadingState label="Loading organization review" />;

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
        title={data.name}
        description="Platform review dossier for organization status, documents, and compliance actions."
        actions={
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            href="/platform/organizations"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DetailCard title="Organization Summary">
            <DetailGrid
              items={[
                { label: "Status", value: <OrganizationStatusBadge status={data.status} /> },
                { label: "Type", value: data.type },
                { label: "Plan", value: data.plan ?? "Not set" },
                { label: "Location", value: [data.city, data.country].filter(Boolean).join(", ") || "Not set" },
                { label: "Created", value: formatDate(data.createdAt) },
                { label: "Plan expires", value: formatPlainDate(data.planExpiresAt) },
              ]}
            />
          </DetailCard>
          <DetailCard title="Profile">
            <DetailGrid
              items={[
                { label: "Legal name", value: data.profile?.legalName },
                { label: "Trade name", value: data.profile?.tradeName },
                { label: "Commercial reg", value: data.profile?.commercialRegNumber },
                { label: "Tax number", value: data.profile?.taxNumber },
                { label: "Website", value: data.profile?.website },
                { label: "Email", value: data.profile?.email },
                { label: "Phone", value: data.profile?.phone },
                { label: "Address", value: data.profile?.address },
              ]}
            />
          </DetailCard>
          <DetailCard title="Verification Documents">
            <DocumentMetadataList documents={verifications} />
          </DetailCard>
          <DetailCard title="Company invitations">
            <OrganizationInvitationsCard id={id} organizationType={data.type} />
          </DetailCard>
          <DetailCard title="Audit / Status Timeline">
            <div className="space-y-3">
              {verifications.length ? (
                verifications.map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-950">{item.documentType.replaceAll("_", " ")}</p>
                      <span className="text-sm text-zinc-500">{item.status.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      Created {formatDate(item.createdAt)}
                      {item.verifiedAt ? ` · Reviewed ${formatDate(item.verifiedAt)}` : ""}
                    </p>
                    {item.notes ? <p className="mt-2 text-sm text-zinc-600">{item.notes}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No timeline items returned yet.</p>
              )}
            </div>
          </DetailCard>
        </div>
        <DetailCard title="Review Actions">
          <div className="space-y-3">
            <ReviewActionDialog
              title="Approve organization"
              description="Approves the organization and any pending review documents for marketplace readiness."
              confirmLabel="Approve"
              isPending={approve.isPending}
              error={approve.error}
              onConfirm={(input) => approve.mutateAsync({ id, input })}
              trigger={<Button className="w-full">Approve organization</Button>}
            />
            <ReviewActionDialog
              title="Reject organization"
              description="Rejects pending review documents and returns the organization to draft."
              confirmLabel="Reject"
              requireReason
              tone="danger"
              isPending={reject.isPending}
              error={reject.error}
              onConfirm={(input) => reject.mutateAsync({ id, input })}
              trigger={<Button className="w-full bg-red-600 hover:bg-red-700">Reject organization</Button>}
            />
            <ReviewActionDialog
              title="Suspend organization"
              description="Suspends the organization due to a compliance or operational issue."
              confirmLabel="Suspend"
              requireReason
              tone="warning"
              isPending={suspend.isPending}
              error={suspend.error}
              onConfirm={(input) => suspend.mutateAsync({ id, input })}
              trigger={<Button className="w-full bg-amber-600 hover:bg-amber-700">Suspend organization</Button>}
            />
            <ReviewActionDialog
              title="Reactivate organization"
              description="Reactivates a suspended organization and returns it to approved status."
              confirmLabel="Reactivate"
              tone="neutral"
              isPending={reactivate.isPending}
              error={reactivate.error}
              onConfirm={(input) => reactivate.mutateAsync({ id, input })}
              trigger={<Button className="w-full bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50">Reactivate organization</Button>}
            />
          </div>
        </DetailCard>
      </div>
    </>
  );
}
