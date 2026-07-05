"use client";

import { CommissionActionDialog } from "@/components/commercial/commission-action-dialog";
import { CommissionStatusBadge } from "@/components/commercial/badges";
import { money } from "@/components/commercial/deal-table";
import { recipientLabel } from "@/components/commercial/commission-table";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useApproveCommission, useCommission, useRejectCommission } from "@/hooks/use-commercial";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/i18n";

export function CommissionDetailView({ id }: { id: string }) {
  const { t } = useI18n();

  const pathname = usePathname();
  const { data: commission, isLoading, error } = useCommission(id);
  const approve = useApproveCommission();
  const reject = useRejectCommission();

  if (isLoading) return <LoadingState label="Loading commission" />;
  if (error) return <FeedbackState tone="error" title={t("adminSweep.commission.could.not.be.loaded.97a1e068")} description={error.message} />;
  if (!commission) return null;

  return (
    <>
      <PageHeader
        title={`${commission.partyType.toLowerCase()} commission`}
        description="Review how this commission was calculated and which deal and recipient it belongs to."
        actions={commission.status === "PENDING" ? (
          <>
            <CommissionActionDialog action="approve" isPending={approve.isPending} error={approve.error} trigger={<Button>{t("adminSweep.approve.7b2c7f14")}</Button>} onConfirm={() => approve.mutateAsync(id)} />
            <CommissionActionDialog action="reject" isPending={reject.isPending} error={reject.error} trigger={<Button className="bg-[var(--color-danger)] text-white hover:opacity-90">{t("adminSweep.reject.2b03b592")}</Button>} onConfirm={(input) => reject.mutateAsync({ id, reason: input.reason ?? "" })} />
          </>
        ) : null}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <DetailCard title={t("adminSweep.commission.calculation.ad418c4f")}>
        <DetailGrid items={[
          { label: "Status", value: <CommissionStatusBadge status={commission.status} /> },
          { label: "Amount", value: money(commission.amount, commission.currency) },
          { label: "Beneficiary type", value: commission.partyType.toLowerCase() },
          { label: "Calculation method", value: commission.commissionType?.toLowerCase() ?? "Recorded amount" },
          { label: "Rule value", value: commission.commissionRule ? `${commission.commissionRule.value}${commission.commissionRule.commissionType === "PERCENTAGE" ? "%" : ` ${commission.commissionRule.currency}`}` : "No rule returned" },
          { label: "Recipient", value: recipientLabel(commission) },
          { label: "Deal", value: <Link className="font-medium text-[var(--color-interactive)] hover:underline" href={`/${pathname.split("/")[1]}/deals/${commission.dealId}`}>{t("adminSweep.open.related.deal.8f727eec")}</Link> },
          { label: "Project", value: commission.project?.name ?? commission.projectId },
          { label: "Unit", value: commission.unit?.unitNumber ?? commission.unitId },
          { label: "Brokerage", value: commission.brokerage?.name ?? commission.brokerageId ?? "None" },
          { label: "Created", value: formatDate(commission.createdAt) },
          { label: "Approved", value: formatDate(commission.approvedAt) },
          { label: "Rejected", value: formatDate(commission.rejectedAt) },
          { label: "Rejection reason", value: commission.rejectionReason ?? "No rejection reason" },
        ]} />
      </DetailCard>
      <DetailCard title={t("adminSweep.what.this.status.means.ef9605b2")}><p className="text-sm leading-6 text-[var(--color-text-muted)]">{statusExplanation(commission.status)}</p><p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">{t("adminSweep.this.record.reflects.commission.calculation.and..cd984586")}</p></DetailCard>
      </div>
    </>
  );
}

function statusExplanation(status: string) { return ({ PENDING: "The calculation is ready for an authorized reviewer.", APPROVED: "An authorized reviewer accepted this calculated commission.", REJECTED: "The calculation was rejected; review the recorded reason.", PAID: "The backend records this entry as paid. No payment action is performed on this page.", CANCELLED: "This commission entry is cancelled and no longer awaits review." } as Record<string, string>)[status] ?? "Review the recorded commission state."; }
