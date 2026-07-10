"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasAnyPermission, isDeveloperRole, isPlatformRole } from "@/lib/permissions";
import { useI18n } from "@/i18n";

export function DeveloperGuard({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();

  const { data, isLoading } = useCurrentUser();

  if (isLoading) return <LoadingState label={t("developer.access.checking")} />;

  const isDeveloperWorkspace =
    data?.organization?.type === "DEVELOPER" && isDeveloperRole(data.user.role);
  const isSharedHrRoute = pathname.startsWith("/developer/hr/");
  const hasSharedHrAccess =
    isSharedHrRoute &&
    hasAnyPermission(data, [
      "hr.employees.view",
      "hr.attendance.self",
      "hr.attendance.view",
      "hr.attendance.manage",
      "hr.view",
      "hr.manage",
    ]) &&
    (isPlatformRole(data?.user.role) || Boolean(data?.organization?.id));

  if (!isDeveloperWorkspace && !hasSharedHrAccess) {
    return (
      <EmptyState
        title={t("adminSweep.developer.access.required.99b0494f")}
        description="This workspace is limited to developer organization users."
      />
    );
  }

  return <>{children}</>;
}
