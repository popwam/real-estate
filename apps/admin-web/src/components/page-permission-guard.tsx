"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { hasAnyPermission } from "@/lib/permissions";

export function PagePermissionGuard({
  permissions,
  children,
}: {
  permissions: string[];
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingState label={t("employeeAccess.checkingAccess")} />;
  }

  if (!permissions.length || hasAnyPermission(data, permissions)) {
    return <>{children}</>;
  }

  return (
    <EmptyState
      icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />}
      title={t("employeeAccess.forbiddenTitle")}
      description={t("employeeAccess.forbiddenDescription")}
    />
  );
}
