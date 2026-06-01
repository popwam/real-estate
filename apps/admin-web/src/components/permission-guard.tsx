"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasAnyPermission } from "@/lib/permissions";

export function PermissionGuard({
  permissions,
  children,
  fallback,
}: {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { data } = useCurrentUser();

  if (!permissions.length || hasAnyPermission(data, permissions)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <EmptyState
          title="Permission required"
          description="Your account does not currently include access to this action."
        />
      )}
    </>
  );
}
