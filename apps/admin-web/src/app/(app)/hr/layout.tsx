import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function HrLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
