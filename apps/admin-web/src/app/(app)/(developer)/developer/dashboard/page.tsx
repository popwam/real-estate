"use client";

import {
  Building2,
  ClipboardCheck,
  FolderKanban,
  MessageSquareText,
  Package,
  Plus,
  UsersRound,
} from "lucide-react";
import { DashboardActionCard } from "@/components/dashboard/dashboard-action-card";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { useCrmSummary } from "@/hooks/use-admin-crm";
import { usePublicLeads } from "@/hooks/use-admin-public";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects, useInventoryUnits } from "@/hooks/use-developer";
import { useReservationRequests } from "@/hooks/use-lead-reservations";
import { useI18n } from "@/i18n";

export default function DeveloperDashboardPage() {
  const { t } = useI18n();

  const currentUser = useCurrentUser();
  const projects = useProjects();
  const inventory = useInventoryUnits();
  const publicLeads = usePublicLeads();
  const crm = useCrmSummary();
  const reservations = useReservationRequests();

  const newPublicLeads = publicLeads.data?.filter((lead) => lead.status === "NEW").length;
  const pendingReservations = reservations.data?.filter(
    (reservation) => reservation.status === "PENDING",
  ).length;
  const firstName = currentUser.data?.user.firstName?.trim();
  const organization = currentUser.data?.organization;

  return (
    <div className="space-y-9">
      <DashboardWelcome
        eyebrow="Developer workspace"
        title={firstName ? `Welcome back, ${firstName}` : "Build, publish, and sell with confidence"}
        description="Keep project readiness, inventory, buyer interest, and reservation decisions visible from one focused workspace."
        context={`${organization?.name ?? "Developer organization"} · ${formatLabel(organization?.status ?? "DRAFT")}`}
        primaryAction={{ href: "/developer/projects/new", label: "Create project" }}
        secondaryAction={{ href: "/developer/crm/leads", label: "Open CRM" }}
        icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
      />

      <DashboardSection
        title={t("adminSweep.business.readiness.9f8ae71c")}
        description="Live organization-scoped summaries highlight what is ready and where the team should act next."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <DashboardKpiCard
            label="Projects"
            value={projects.data?.length}
            description="Projects are available for review, publishing, and selling setup."
            emptyDescription="Create the first project to begin the developer journey."
            href="/developer/projects"
            linkLabel="Open projects"
            icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
            isLoading={projects.isLoading}
            error={projects.error}
          />
          <DashboardKpiCard
            label="Inventory units"
            value={inventory.data?.length}
            description="Units are available for pricing, visibility, and availability review."
            emptyDescription="No inventory units have been added yet."
            href="/developer/inventory"
            linkLabel="Open inventory"
            icon={<Package className="h-5 w-5" aria-hidden="true" />}
            isLoading={inventory.isLoading}
            error={inventory.error}
          />
          <DashboardKpiCard
            label="New public leads"
            value={newPublicLeads}
            description="New website enquiries are waiting for a first review."
            emptyDescription="No new public enquiries are waiting."
            href="/developer/public-leads"
            linkLabel="Review public leads"
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            isLoading={publicLeads.isLoading}
            error={publicLeads.error}
          />
          <DashboardKpiCard
            label="New CRM leads"
            value={crm.data?.leads.new}
            description="New leads need qualification and a clear next action."
            emptyDescription="No new CRM leads are waiting."
            href="/developer/crm/leads"
            linkLabel="Open CRM leads"
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            isLoading={crm.isLoading}
            error={crm.error}
          />
          <DashboardKpiCard
            label="Open conversations"
            value={crm.data?.conversations.open}
            description="Active conversations may need a sales response."
            emptyDescription="There are no open conversations."
            href="/developer/conversations"
            linkLabel="Open conversations"
            icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
            isLoading={crm.isLoading}
            error={crm.error}
          />
          <DashboardKpiCard
            label="Pending reservations"
            value={pendingReservations}
            description="Reservation requests need an inventory-aware decision."
            emptyDescription="No reservation requests are pending."
            href="/developer/reservation-requests"
            linkLabel="Review reservations"
            icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
            isLoading={reservations.isLoading}
            error={reservations.error}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title={t("adminSweep.next.recommended.actions.1a853b71")}
        description="Move from project setup to buyer follow-up without losing the commercial thread."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardActionCard
            title={t("adminSweep.create.a.project.a469a595")}
            description="Start a new project record and prepare its core public and commercial information."
            href="/developer/projects/new"
            actionLabel="New project"
            icon={<Plus className="h-5 w-5" aria-hidden="true" />}
            emphasis
          />
          <DashboardActionCard
            title={t("adminSweep.review.project.readiness.068288d8")}
            description="Check visibility, phases, payment plans, and selling permissions."
            href="/developer/projects"
            actionLabel="Open projects"
            icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
          />
          <DashboardActionCard
            title={t("adminSweep.keep.inventory.current.2ff0a36e")}
            description="Review availability, pricing, and public visibility across all units."
            href="/developer/inventory"
            actionLabel="Open inventory"
            icon={<Package className="h-5 w-5" aria-hidden="true" />}
          />
          <DashboardActionCard
            title={t("adminSweep.respond.to.buyer.interest.33c2b8c8")}
            description="Triage new website enquiries before moving qualified buyers into CRM."
            href="/developer/public-leads"
            actionLabel="Review public leads"
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
          />
          <DashboardActionCard
            title={t("adminSweep.advance.the.sales.pipeline.00055ab9")}
            description="Assign next actions, follow conversations, and keep leads moving."
            href="/developer/crm/leads"
            actionLabel="Open CRM"
            icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
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
