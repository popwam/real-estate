"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasAnyPermission, isPlatformRole } from "@/lib/permissions";
import { useI18n } from "@/i18n";

export function PlatformGuard({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();

  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingState label="Checking platform access" />;
  }

  const hasPlatformAccess =
    isPlatformRole(data?.user.role) &&
    data?.organization?.type === "PLATFORM";

  const organizationRoute = pathname.match(/^\/platform\/organizations\/([^/]+)(?:\/([^/]+))?$/);
  const sectionPermissions: Record<string, string[]> = {
    offices: ["company.offices.view", "company.offices.manage"],
    "wifi-rules": ["company.wifi_rules.view", "company.wifi_rules.manage"],
    "access-levels": ["company.access_levels.view", "company.access_levels.manage"],
    attendance: ["hr.attendance.view", "hr.attendance.manage"],
  };
  const companyOrganizationAccess = Boolean(
    organizationRoute &&
      data?.organization?.id === organizationRoute[1] &&
      hasAnyPermission(
        data,
        sectionPermissions[organizationRoute[2] ?? ""] ?? [
          "company.profile.view",
          "company.profile.manage",
          "company.settings.view",
          "company.settings.manage",
        ],
      ),
  );

  if (!hasPlatformAccess && !companyOrganizationAccess) {
    return (
      <EmptyState
        title={t("adminSweep.platform.access.required.0d7ecbc3")}
        description="This workspace is limited to POPWAM platform users with verification permissions."
      />
    );
  }

  return <>{children}</>;
}
