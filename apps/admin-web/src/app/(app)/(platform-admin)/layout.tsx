import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlatformGuard } from "@/components/platform/platform-guard";

export default function PlatformAdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <PlatformGuard>{children}</PlatformGuard>
    </DashboardShell>
  );
}
