import { FolderKanban, Handshake, Package } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";

export default function DeveloperDashboardPage() {
  return (
    <>
      <PageHeader
        title="Developer Dashboard"
        description="Workspace foundation for projects, inventory, agreements, and broker access."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Projects" value="--" description="Project management starts in a later slice." icon={<FolderKanban className="h-5 w-5" />} />
        <StatCard label="Inventory" value="--" description="Units tables are placeholders for now." icon={<Package className="h-5 w-5" />} />
        <StatCard label="Agreements" value="--" description="Brokerage agreements are available in backend." icon={<Handshake className="h-5 w-5" />} />
      </div>
    </>
  );
}
