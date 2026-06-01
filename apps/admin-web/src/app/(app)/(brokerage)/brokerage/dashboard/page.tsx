import { Search, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/empty-state";

export default function BrokerageDashboardPage() {
  return (
    <>
      <PageHeader
        title="Brokerage Dashboard"
        description="Brokerage workspace foundation for marketplace browsing and team operations."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Visible Projects" value="--" description="Marketplace read APIs are ready for future UI." icon={<Search className="h-5 w-5" />} />
        <StatCard label="Brokers" value="--" description="Broker management is out of Slice 1." icon={<Users className="h-5 w-5" />} />
        <StatCard label="Verification" value="--" description="Organization status comes from /auth/me." icon={<ShieldCheck className="h-5 w-5" />} />
      </div>
      <div className="mt-8">
        <EmptyState
          title="Marketplace browsing shell"
          description="Team 4 owns mobile marketplace browsing first; admin web can add debug or brokerage views in later slices."
        />
      </div>
    </>
  );
}
