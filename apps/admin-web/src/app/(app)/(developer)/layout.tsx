import type { ReactNode } from "react";
import { DeveloperGuard } from "@/components/developer/developer-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <DeveloperGuard>{children}</DeveloperGuard>
    </DashboardShell>
  );
}
