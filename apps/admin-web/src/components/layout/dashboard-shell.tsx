"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { IconSidebar } from "@/components/layout/icon-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { RoutePermissionBoundary } from "@/components/layout/route-permission-boundary";
import { Topbar } from "@/components/layout/topbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
        <IconSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1.5rem)] pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
            <RoutePermissionBoundary>{children}</RoutePermissionBoundary>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
