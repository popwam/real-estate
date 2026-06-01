"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasAnyPermission, isPlatformRole } from "@/lib/permissions";

export function PlatformGuard({ children }: { children: ReactNode }) {
  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingState label="Checking platform access" />;
  }

  const hasPlatformAccess =
    isPlatformRole(data?.user.role) &&
    data?.organization?.type === "PLATFORM" &&
    hasAnyPermission(data, [
      "organizations.verify",
      "organizations.view_all",
      "organizations.suspend",
    ]);

  if (!hasPlatformAccess) {
    return (
      <EmptyState
        title="Platform access required"
        description="This workspace is limited to POPWAM platform users with verification permissions."
      />
    );
  }

  return <>{children}</>;
}
