import { DealStatusBadge } from "@/components/commercial/badges";
import { brokerName, money } from "@/components/commercial/deal-table";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { formatDate } from "@/lib/format";
import type { Deal } from "@/types/commercial";

export function DealSummaryCard({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-6">
      <DetailCard title="Deal Summary">
        <DetailGrid items={[
          { label: "Status", value: <DealStatusBadge status={deal.status} /> },
          { label: "Deal room", value: deal.dealRoomId },
          { label: "Final price", value: money(deal.finalPrice, deal.currency) },
          { label: "Created", value: formatDate(deal.createdAt) },
          { label: "Approved", value: formatDate(deal.approvedAt) },
          { label: "Sold", value: formatDate(deal.soldAt) },
        ]} />
      </DetailCard>
      <DetailCard title="Project And Parties">
        <DetailGrid items={[
          { label: "Project", value: deal.project?.name ?? deal.projectId },
          { label: "Unit", value: deal.unit?.unitNumber ?? deal.unitId },
          { label: "Developer", value: deal.developer?.name ?? deal.developerId },
          { label: "Brokerage", value: deal.brokerage?.name ?? deal.brokerageId ?? "Individual broker" },
          { label: "Broker", value: brokerName(deal) },
          { label: "Client", value: deal.client?.name ?? deal.clientId },
        ]} />
      </DetailCard>
      <DetailCard title="Cancellation">
        <DetailGrid items={[
          { label: "Cancelled", value: formatDate(deal.cancelledAt) },
          { label: "Reason", value: deal.cancellationReason ?? "None" },
        ]} />
      </DetailCard>
    </div>
  );
}
