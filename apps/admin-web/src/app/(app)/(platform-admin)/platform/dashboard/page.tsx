import { ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/status-badge";

const reviewRows = [
  { id: "mock-1", organization: "North Coast Developments", type: "DEVELOPER", status: "PENDING_REVIEW" },
  { id: "mock-2", organization: "Cairo Prime Brokers", type: "BROKERAGE", status: "UNDER_REVIEW" },
];

export default function PlatformDashboardPage() {
  return (
    <>
      <PageHeader
        title="Platform Dashboard"
        description="Operational overview for verification, organizations, and marketplace governance."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Organizations" value="--" description="Live counts arrive in Slice 2." icon={<Users className="h-5 w-5" />} />
        <StatCard label="Pending Reviews" value="--" description="Connects to platform queue next." icon={<ClipboardCheck className="h-5 w-5" />} />
        <StatCard label="Marketplace Rules" value="Ready" description="Visibility debug views are future work." icon={<ShieldCheck className="h-5 w-5" />} />
      </div>
      <section className="mt-8">
        <PageHeader title="Verification Snapshot" description="Placeholder queue rows for shell validation." />
        <DataTable
          columns={[
            { key: "organization", header: "Organization" },
            { key: "type", header: "Type" },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={String(row.status)} /> },
          ]}
          data={reviewRows}
        />
      </section>
    </>
  );
}
