import type { ReactNode } from "react";
import { BrokerageGuard } from "@/components/brokerage/brokerage-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function BrokerageLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <BrokerageGuard>{children}</BrokerageGuard>
    </DashboardShell>
  );
}
