"use client";

import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ClipboardCheck,
  Handshake,
  MessageSquareText,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { DashboardActionCard } from "@/components/dashboard/dashboard-action-card";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { useCrmSummary, useMarketplaceCrmLeads } from "@/hooks/use-admin-crm";
import { useCommissions, useDeals } from "@/hooks/use-commercial";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyLeadClaims, useReservationRequests } from "@/hooks/use-lead-reservations";
import { useI18n } from "@/i18n";

export default function BrokerageDashboardPage() {
  const { t } = useI18n();

  const currentUser = useCurrentUser();
  const marketplaceLeads = useMarketplaceCrmLeads({ page: 1, pageSize: 1 });
  const crm = useCrmSummary();
  const claims = useMyLeadClaims();
  const reservations = useReservationRequests();
  const deals = useDeals();
  const commissions = useCommissions();

  const activeClaims = claims.data?.filter((claim) => claim.status === "ACTIVE").length;
  const pendingReservations = reservations.data?.filter(
    (reservation) => reservation.status === "PENDING",
  ).length;
  const firstName = currentUser.data?.user.firstName?.trim();
  const organization = currentUser.data?.organization;

  return (
    <div className="space-y-9">
      <DashboardWelcome
        eyebrow="Brokerage workspace"
        title={firstName ? `Welcome back, ${firstName}` : "Your daily brokerage workspace"}
        description="Find available opportunities, protect client ownership, respond quickly, and keep reservations and deals moving."
        context={`${organization?.name ?? "Brokerage workspace"} · ${formatLabel(organization?.status ?? "DRAFT")}`}
        primaryAction={{ href: "/brokerage/crm/marketplace-leads", label: "Browse marketplace leads" }}
        secondaryAction={{ href: "/brokerage/conversations", label: "Open conversations" }}
        icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
      />

      <DashboardSection
        title={t("adminSweep.today.s.work.9e6f6594")}
        description="Live, role-scoped summaries show the work available to this broker or brokerage account."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <DashboardKpiCard
            label="Marketplace leads"
            value={marketplaceLeads.data?.pagination.total}
            description="Available marketplace leads can be reviewed for eligibility."
            emptyDescription="No marketplace leads are currently available."
            href="/brokerage/crm/marketplace-leads"
            linkLabel="Browse marketplace leads"
            icon={<Search className="h-5 w-5" aria-hidden="true" />}
            isLoading={marketplaceLeads.isLoading}
            error={marketplaceLeads.error}
          />
          <DashboardKpiCard
            label="My CRM leads"
            value={crm.data?.leads.total}
            description="Leads in this workspace are ready for follow-up and qualification."
            emptyDescription="No CRM leads are assigned to this workspace yet."
            href="/brokerage/crm/leads"
            linkLabel="Open CRM leads"
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            isLoading={crm.isLoading}
            error={crm.error}
          />
          <DashboardKpiCard
            label="Open conversations"
            value={crm.data?.conversations.open}
            description="Active client conversations may need a response."
            emptyDescription="There are no open conversations."
            href="/brokerage/conversations"
            linkLabel="Open conversations"
            icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
            isLoading={crm.isLoading}
            error={crm.error}
          />
          <DashboardKpiCard
            label="Active claims"
            value={activeClaims}
            description="Active claims are protecting client ownership for this broker."
            emptyDescription="There are no active lead claims."
            href="/brokerage/lead-claims"
            linkLabel="Open claims"
            icon={<UserCheck className="h-5 w-5" aria-hidden="true" />}
            isLoading={claims.isLoading}
            error={claims.error}
          />
          <DashboardKpiCard
            label="Pending reservations"
            value={pendingReservations}
            description="Reservation requests are waiting for a developer decision."
            emptyDescription="No reservation requests are pending."
            href="/brokerage/reservation-requests"
            linkLabel="Open reservations"
            icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
            isLoading={reservations.isLoading}
            error={reservations.error}
          />
          <DashboardKpiCard
            label="Deals"
            value={deals.data?.length}
            description="Commercial deals are visible for progress review."
            emptyDescription="No deals have been created yet."
            href="/brokerage/deals"
            linkLabel="Open deals"
            icon={<Handshake className="h-5 w-5" aria-hidden="true" />}
            isLoading={deals.isLoading}
            error={deals.error}
          />
          <DashboardKpiCard
            label="Commissions"
            value={commissions.data?.length}
            description="Commission records are available for status review."
            emptyDescription="No commission records are available yet."
            href="/brokerage/commissions"
            linkLabel="Open commissions"
            icon={<BadgeDollarSign className="h-5 w-5" aria-hidden="true" />}
            isLoading={commissions.isLoading}
            error={commissions.error}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title={t("adminSweep.quick.actions.e47e8042")}
        description="Keep the daily broker journey close: discover, follow up, protect, and progress the deal."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardActionCard
            title={t("adminSweep.find.available.leads.6067a2f9")}
            description="Review marketplace opportunities and claim only the leads you are ready to serve."
            href="/brokerage/crm/marketplace-leads"
            actionLabel="Browse leads"
            icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
            emphasis
          />
          <DashboardActionCard
            title={t("adminSweep.reply.to.clients.338bd57a")}
            description="Continue active conversations and keep response times under control."
            href="/brokerage/conversations"
            actionLabel="Open conversations"
            icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
          />
          <DashboardActionCard
            title={t("adminSweep.review.client.protection.8e09301e")}
            description="Check active claims, expiry, and the next safe action for each client."
            href="/brokerage/lead-claims"
            actionLabel="Open claims"
            icon={<UserCheck className="h-5 w-5" aria-hidden="true" />}
          />
          <DashboardActionCard
            title={t("adminSweep.advance.active.deals.10774053")}
            description="Review deal progress and open the related commercial workspace."
            href="/brokerage/deals"
            actionLabel="Open deals"
            icon={<Handshake className="h-5 w-5" aria-hidden="true" />}
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
