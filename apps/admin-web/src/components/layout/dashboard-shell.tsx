"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { IconSidebar } from "@/components/layout/icon-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Topbar } from "@/components/layout/topbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
        <IconSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1.5rem)] pt-6 lg:px-8 lg:pb-6">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
