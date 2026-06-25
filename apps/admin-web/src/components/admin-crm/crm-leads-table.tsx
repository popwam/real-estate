"use client";

import { LeadResponsiveList } from "@/components/crm/lead-responsive-list";
import type { CrmLead } from "@/types/admin-crm";

export function CrmLeadsTable({ leads, basePath, showClaimAction, isClaiming, claimError, onClaim }: { leads: CrmLead[]; basePath: string; showClaimAction?: boolean; isClaiming?: boolean; claimError?: Error | null; onClaim?: (id: string) => Promise<unknown> }) {
  return <LeadResponsiveList leads={leads} basePath={basePath} marketplace={showClaimAction} isClaiming={isClaiming} claimError={claimError} onClaim={onClaim} />;
}
