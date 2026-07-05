"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isDeveloperRole } from "@/lib/permissions";
import { useI18n } from "@/i18n";

export function DeveloperGuard({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  const { data, isLoading } = useCurrentUser();

  if (isLoading) return <LoadingState label="Checking developer access" />;

  if (data?.organization?.type !== "DEVELOPER" || !isDeveloperRole(data.user.role)) {
    return (
      <EmptyState
        title={t("adminSweep.developer.access.required.99b0494f")}
        description="This workspace is limited to developer organization users."
      />
    );
  }

  return <>{children}</>;
}
