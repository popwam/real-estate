"use client";

import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Globe2,
  MessagesSquare,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { DashboardActionCard } from "@/components/dashboard/dashboard-action-card";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { useCrmSummary } from "@/hooks/use-admin-crm";
import { usePlatformDomains } from "@/hooks/use-admin-public";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLeadClaimConflicts } from "@/hooks/use-lead-reservations";
import { useOrganizations, useVerificationQueue } from "@/hooks/use-platform-admin";

export default function PlatformDashboardPage() {
  const currentUser = useCurrentUser();
  const organizations = useOrganizations();
  const verifications = useVerificationQueue();
  const domains = usePlatformDomains();
  const conflicts = useLeadClaimConflicts();
  const crm = useCrmSummary();

  const pendingDomains = domains.data?.filter((domain) => domain.status !== "VERIFIED").length;
  const unresolvedConflicts = conflicts.data?.filter((conflict) => !conflict.resolvedAt).length;
  const firstName = currentUser.data?.user.firstName?.trim();
  const organization = currentUser.data?.organization;

  return (
    <div className="space-y-9">
      <DashboardWelcome
        eyebrow="Platform operations"
        title={firstName ? `Welcome back, ${firstName}` : "Platform control center"}
        description="Review trust queues, resolve marketplace exceptions, and guide organizations toward a safe public launch."
        context={`${organization?.name ?? "POPWAM Platform"} · ${formatLabel(organization?.status ?? "APPROVED")}`}
        primaryAction={{ href: "/platform/verifications", label: "Review verifications" }}
        secondaryAction={{ href: "/platform/organizations", label: "Open organizations" }}
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
      />

      <DashboardSection
        title="Needs your attention"
        description="Current counts come from existing platform and CRM endpoints. A clear queue is shown as zero—not as missing data."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardKpiCard
            label="Organizations"
            value={organizations.data?.length}
            description="Organizations currently visible to the platform workspace."
            emptyDescription="No organizations have been added yet."
            href="/platform/organizations"
            linkLabel="Manage organizations"
            icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
            isLoading={organizations.isLoading}
            error={organizations.error}
          />
          <DashboardKpiCard
            label="Verification queue"
            value={verifications.data?.length}
            description="Submitted documents are waiting for a platform decision."
            emptyDescription="The verification review queue is clear."
            href="/platform/verifications"
            linkLabel="Review verifications"
            icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
            isLoading={verifications.isLoading}
            error={verifications.error}
          />
          <DashboardKpiCard
            label="Domains to review"
            value={pendingDomains}
            description="Domain records still need verification or follow-up."
            emptyDescription="No domain records currently need attention."
            href="/platform/domains"
            linkLabel="Review domains"
            icon={<Globe2 className="h-5 w-5" aria-hidden="true" />}
            isLoading={domains.isLoading}
            error={domains.error}
          />
          <DashboardKpiCard
            label="Claim conflicts"
            value={unresolvedConflicts}
            description="Unresolved lead ownership conflicts require a decision."
            emptyDescription="No unresolved claim conflicts."
            href="/platform/lead-claim-conflicts"
            linkLabel="Resolve conflicts"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
            isLoading={conflicts.isLoading}
            error={conflicts.error}
          />
          <DashboardKpiCard
            label="New CRM leads"
            value={crm.data?.leads.new}
            description="New leads are available for routing or support review."
            emptyDescription="There are no new CRM leads waiting."
            href="/platform/crm/leads"
            linkLabel="Open CRM leads"
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            isLoading={crm.isLoading}
            error={crm.error}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Quick actions"
        description="Start the most common platform reviews without searching through every module."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardActionCard
            title="Create an organization"
            description="Open the organization workspace to register a developer or brokerage and begin review."
            href="/platform/organizations"
            actionLabel="Create organization"
            icon={<UserPlus className="h-5 w-5" aria-hidden="true" />}
            emphasis
          />
          <DashboardActionCard
            title="Review trust documents"
            description="Work through submitted organization evidence and record a clear decision."
            href="/platform/verifications"
            actionLabel="Open verification queue"
            icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
          />
          <DashboardActionCard
            title="Resolve marketplace exceptions"
            description="Compare claim evidence and settle unresolved lead ownership conflicts."
            href="/platform/lead-claim-conflicts"
            actionLabel="Open conflicts"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          />
          <DashboardActionCard
            title="Support conversations"
            description="Review active conversations when a participant needs platform assistance."
            href="/platform/conversations"
            actionLabel="Open conversations"
            icon={<MessagesSquare className="h-5 w-5" aria-hidden="true" />}
          />
        </div>
      </DashboardSection>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
