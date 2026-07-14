"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, CalendarClock, CircleAlert, Database, FileCheck2, GitBranch, Globe2, HardDrive, HeartPulse, UsersRound } from "lucide-react";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PlatformWelcomeModal } from "@/components/dashboard/platform-welcome-modal";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { ApiError, getPlatformDashboardApi } from "@/lib/api";

export default function PlatformDashboardPage() {
  const { t } = useI18n();
  const dashboard = useQuery({ queryKey: ["platform", "dashboard"], queryFn: getPlatformDashboardApi });
  const data = dashboard.data;
  const organizationStatus = data?.organizations.byStatus ?? {};
  const subscriptionStatus = data?.subscriptions.byStatus ?? {};
  const metric = (label: string, value: number | undefined, href: string, icon: React.ReactNode, emptyDescription: string) => (
    <DashboardKpiCard label={label} value={value} description={t("platformDashboard.realDataDescription")} emptyDescription={emptyDescription} href={href} linkLabel={t("platformDashboard.openDetails")} icon={icon} isLoading={dashboard.isLoading} error={dashboard.error} loadingDescription={t("platformDashboard.loading")} errorDescription={t("platformDashboard.loadError")} unavailableLabel={t("platformDashboard.unavailable")} />
  );

  return (
    <div className="space-y-8">
      <PlatformWelcomeModal />
      <PageHeader
        title={t("platformDashboard.title")}
        description={t("platformDashboard.description")}
        actions={<Button className="ui-button-secondary" type="button" onClick={() => window.dispatchEvent(new Event("popwam:open-platform-welcome"))}>{t("platformDashboard.about")}</Button>}
      />
      {dashboard.error ? <FeedbackState tone="error" title={t("platformDashboard.loadError")} description={dashboard.error instanceof ApiError && dashboard.error.requestId ? t("platformDashboard.requestId", { requestId: dashboard.error.requestId }) : t("platformDashboard.loadError")} /> : null}

      <DashboardSection title={t("platformDashboard.organizations")} description={t("platformDashboard.organizationsDescription")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metric(t("platformDashboard.totalOrganizations"), data?.organizations.total, "/platform/organizations", <Building2 className="h-5 w-5" />, t("platformDashboard.emptyOrganizations"))}
          {metric(t("platformDashboard.activeOrganizations"), organizationStatus.ACTIVE ?? 0, "/platform/organizations", <Activity className="h-5 w-5" />, t("platformDashboard.zeroActive"))}
          {metric(t("platformDashboard.draftOrganizations"), (organizationStatus.DRAFT ?? 0) + (organizationStatus.DOCUMENTS_REQUIRED ?? 0), "/platform/organizations", <Building2 className="h-5 w-5" />, t("platformDashboard.zeroDraft"))}
          {metric(t("platformDashboard.awaitingVerification"), (organizationStatus.PENDING_REVIEW ?? 0) + (organizationStatus.MANUAL_REVIEW_REQUIRED ?? 0), "/platform/verifications", <FileCheck2 className="h-5 w-5" />, t("platformDashboard.zeroVerification"))}
          {metric(t("platformDashboard.registeredCountries"), data?.operations.supportedCountries, "/platform/settings/metadata", <Globe2 className="h-5 w-5" />, t("platformDashboard.zeroCountries"))}
        </div>
      </DashboardSection>

      <DashboardSection title={t("platformDashboard.distributions")} description={t("platformDashboard.distributionsDescription")}>
        <div className="grid gap-4 lg:grid-cols-3">
          <BreakdownCard title={t("platformDashboard.byStatus")} values={organizationStatus} empty={t("platformDashboard.emptyOrganizations")} />
          <BreakdownCard title={t("platformDashboard.byType")} values={data?.organizations.byType} empty={t("platformDashboard.emptyOrganizations")} />
          <BreakdownCard title={t("platformDashboard.byCountry")} values={Object.fromEntries((data?.organizations.byCountry ?? []).map((entry) => [entry.country ?? t("common.notSet"), entry.count]))} empty={t("platformDashboard.zeroCountries")} />
        </div>
      </DashboardSection>

      <DashboardSection title={t("platformDashboard.subscriptions")} description={t("platformDashboard.subscriptionsDescription")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metric(t("platformDashboard.activeSubscriptions"), subscriptionStatus.ACTIVE ?? 0, "/platform/settings/subscriptions", <Activity className="h-5 w-5" />, t("platformDashboard.zeroSubscriptions"))}
          {metric(t("platformDashboard.trialSubscriptions"), subscriptionStatus.TRIAL ?? 0, "/platform/settings/subscriptions", <CalendarClock className="h-5 w-5" />, t("platformDashboard.zeroTrials"))}
          {metric(t("platformDashboard.expiringSubscriptions"), data?.subscriptions.expiringWithin30Days, "/platform/settings/subscriptions", <CalendarClock className="h-5 w-5" />, t("platformDashboard.zeroExpiring"))}
          {metric(t("platformDashboard.inactiveSubscriptions"), (subscriptionStatus.EXPIRED ?? 0) + (subscriptionStatus.SUSPENDED ?? 0) + (subscriptionStatus.CANCELLED ?? 0), "/platform/settings/subscriptions", <CircleAlert className="h-5 w-5" />, t("platformDashboard.zeroInactive"))}
          {metric(t("platformDashboard.plansInUse"), data?.subscriptions.planDistribution.length, "/platform/settings/plans", <FileCheck2 className="h-5 w-5" />, t("platformDashboard.zeroPlans"))}
        </div>
      </DashboardSection>

      <DashboardSection title={t("platformDashboard.planDistribution")} description={t("platformDashboard.planDistributionDescription")}>
        <BreakdownCard
          title={t("platformDashboard.plansInUse")}
          values={Object.fromEntries((data?.subscriptions.planDistribution ?? []).map((entry) => [entry.planName || entry.planCode, entry.count]))}
          empty={t("platformDashboard.zeroPlans")}
        />
      </DashboardSection>

      <DashboardSection title={t("platformDashboard.peopleAndOperations")} description={t("platformDashboard.peopleDescription")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metric(t("platformDashboard.platformUsers"), data?.people.platformUsers, "/platform/organizations", <UsersRound className="h-5 w-5" />, t("platformDashboard.zeroPlatformUsers"))}
          {metric(t("platformDashboard.companyUsers"), data?.people.companyUsers, "/platform/organizations", <UsersRound className="h-5 w-5" />, t("platformDashboard.zeroCompanyUsers"))}
          {metric(t("platformDashboard.employees"), data?.people.employees, "/hr/employees", <UsersRound className="h-5 w-5" />, t("platformDashboard.zeroEmployees"))}
          {metric(t("platformDashboard.applicants"), data?.people.applicantsAwaitingReview, "/hr/recruitment/applicants", <FileCheck2 className="h-5 w-5" />, t("platformDashboard.zeroApplicants"))}
          {metric(t("platformDashboard.interviews"), data?.people.interviewsScheduled, "/hr/recruitment/applicants", <CalendarClock className="h-5 w-5" />, t("platformDashboard.zeroInterviews"))}
          {metric(t("platformDashboard.activeOffices"), data?.operations.activeOffices, "/platform/organizations", <Building2 className="h-5 w-5" />, t("platformDashboard.zeroOffices"))}
          {metric(t("platformDashboard.attendanceIssues"), data?.operations.attendanceIssues, "/hr/attendance", <CircleAlert className="h-5 w-5" />, t("platformDashboard.zeroAttendanceIssues"))}
          {metric(t("platformDashboard.unresolvedAlerts"), data?.operations.unresolvedAlerts, "/platform/lead-claim-conflicts", <CircleAlert className="h-5 w-5" />, t("platformDashboard.zeroAlerts"))}
        </div>
      </DashboardSection>

      <DashboardSection title={t("platformDashboard.health")} description={t("platformDashboard.healthDescription")}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HealthCard icon={<Database className="h-5 w-5" />} label={t("platformDashboard.database")} ready={data?.health.database.connected} readyLabel={t("platformDashboard.ready")} notReadyLabel={t("platformDashboard.notReady")} loadingLabel={t("platformDashboard.loading")} />
          <HealthCard icon={<GitBranch className="h-5 w-5" />} label={t("platformDashboard.migrations")} ready={data?.health.database.migrationsReady} readyLabel={t("platformDashboard.ready")} notReadyLabel={t("platformDashboard.migrationAttention")} loadingLabel={t("platformDashboard.loading")} />
          <HealthCard icon={<HardDrive className="h-5 w-5" />} label={t("platformDashboard.r2")} ready={data?.health.r2.configured} readyLabel={t("platformDashboard.configured")} notReadyLabel={t("platformDashboard.notConfigured")} loadingLabel={t("platformDashboard.loading")} />
          <HealthCard icon={<HeartPulse className="h-5 w-5" />} label={t("platformDashboard.cloudflare")} ready={data?.health.cloudflareExtraction.configured} readyLabel={t("platformDashboard.configured")} notReadyLabel={data?.health.cloudflareExtraction.enabled ? t("platformDashboard.notConfigured") : t("platformDashboard.disabled")} loadingLabel={t("platformDashboard.loading")} />
          {data ? Object.entries(data.health.integrations).map(([provider, status]) => <StatusCard key={provider} icon={<Activity className="h-5 w-5" />} label={providerLabel(provider, t)} status={t(`platformDashboard.integrationStatus.${status.toLowerCase()}`)} />) : <HealthCard icon={<Activity className="h-5 w-5" />} label={t("platformDashboard.integrations")} ready={undefined} readyLabel={t("platformDashboard.connected")} notReadyLabel={t("platformDashboard.noneConnected")} loadingLabel={t("platformDashboard.loading")} />}
        </div>
      </DashboardSection>
    </div>
  );
}

function BreakdownCard({ title, values, empty }: { title: string; values?: Record<string, number>; empty: string }) {
  const entries = Object.entries(values ?? {}).filter(([, value]) => value > 0);
  return <div className="ui-card p-4"><h3 className="font-semibold text-[var(--color-foreground)]">{title}</h3>{entries.length ? <dl className="mt-3 space-y-2">{entries.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 text-sm"><dt className="truncate text-[var(--color-muted)]">{label.replaceAll("_", " ")}</dt><dd className="font-semibold tabular-nums text-[var(--color-foreground)]">{value}</dd></div>)}</dl> : <p className="mt-3 text-sm text-[var(--color-muted)]">{empty}</p>}</div>;
}

function providerLabel(provider: string, t: (key: string) => string) {
  const key = `platformDashboard.integration.${provider}`;
  return t(key);
}

function StatusCard({ icon, label, status }: { icon: React.ReactNode; label: string; status: string }) {
  return <div className="ui-card flex items-center gap-3 p-4"><span className="text-[var(--color-accent)]">{icon}</span><div><p className="font-semibold text-[var(--color-foreground)]">{label}</p><p className="text-sm text-[var(--color-muted)]">{status}</p></div></div>;
}

function HealthCard({ icon, label, ready, readyLabel, notReadyLabel, loadingLabel }: { icon: React.ReactNode; label: string; ready?: boolean; readyLabel: string; notReadyLabel: string; loadingLabel: string }) {
  return <div className="ui-card flex items-center gap-3 p-4"><span className="text-[var(--color-accent)]">{icon}</span><div><p className="font-semibold text-[var(--color-foreground)]">{label}</p><p className="text-sm text-[var(--color-muted)]">{ready === undefined ? loadingLabel : ready ? readyLabel : notReadyLabel}</p></div></div>;
}
