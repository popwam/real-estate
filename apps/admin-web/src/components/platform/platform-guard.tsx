"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasAnyPermission, isPlatformRole } from "@/lib/permissions";
import { useI18n } from "@/i18n";

export function PlatformGuard({ children }: { children: ReactNode }) {
  const { t } = useI18n();

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
        title={t("adminSweep.platform.access.required.0d7ecbc3")}
        description="This workspace is limited to POPWAM platform users with verification permissions."
      />
    );
  }

  return <>{children}</>;
}
