"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasAnyPermission } from "@/lib/permissions";
import { useI18n } from "@/i18n";

export function PermissionGuard({
  permissions,
  children,
  fallback,
}: {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { t } = useI18n();

  const { data } = useCurrentUser();

  if (!permissions.length || hasAnyPermission(data, permissions)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <EmptyState
          title={t("adminSweep.permission.required.291ee371")}
          description="Your account does not currently include access to this action."
        />
      )}
    </>
  );
}
