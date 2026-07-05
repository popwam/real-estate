"use client";

import { DealStatusBadge } from "@/components/commercial/badges";
import { brokerName, money } from "@/components/commercial/deal-table";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { formatDate } from "@/lib/format";
import type { Deal } from "@/types/commercial";
import { useI18n } from "@/i18n";

export function DealSummaryCard({ deal }: { deal: Deal }) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <DetailCard title={t("adminSweep.deal.summary.a4d44a7d")}>
        <DetailGrid items={[
          { label: "Status", value: <DealStatusBadge status={deal.status} /> },
          { label: "Deal room", value: deal.dealRoom?.status ? `${deal.dealRoom.status.replaceAll("_", " ").toLowerCase()} workspace` : "Related negotiation workspace" },
          { label: "Final price", value: money(deal.finalPrice, deal.currency) },
          { label: "Created", value: formatDate(deal.createdAt) },
          { label: "Approved", value: formatDate(deal.approvedAt) },
          { label: "Sold", value: formatDate(deal.soldAt) },
        ]} />
      </DetailCard>
      <DetailCard title={t("adminSweep.project.and.parties.cf1b8e2c")}>
        <DetailGrid items={[
          { label: "Project", value: deal.project?.name ?? deal.projectId },
          { label: "Unit", value: deal.unit?.unitNumber ?? deal.unitId },
          { label: "Developer", value: deal.developer?.name ?? deal.developerId },
          { label: "Brokerage", value: deal.brokerage?.name ?? deal.brokerageId ?? "Individual broker" },
          { label: "Broker", value: brokerName(deal) },
          { label: "Client", value: deal.client?.name ?? deal.clientId },
        ]} />
      </DetailCard>
      <DetailCard title={t("adminSweep.cancellation.319aaae4")}>
        <DetailGrid items={[
          { label: "Cancelled", value: formatDate(deal.cancelledAt) },
          { label: "Reason", value: deal.cancellationReason ?? "None" },
        ]} />
      </DetailCard>
    </div>
  );
}
