"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isBrokerageRole } from "@/lib/permissions";

export function BrokerageGuard({ children }: { children: ReactNode }) {
  const { data, isLoading } = useCurrentUser();
  const brokerageOrg =
    data?.organization?.type === "BROKERAGE" || data?.organization?.type === "INDIVIDUAL_BROKER";

  if (isLoading) return <LoadingState label="Checking brokerage access" />;

  if (!brokerageOrg || !isBrokerageRole(data?.user.role)) {
    return (
      <EmptyState
        title="Brokerage access required"
        description="This workspace is limited to brokerage and broker users."
      />
    );
  }

  return <>{children}</>;
}
