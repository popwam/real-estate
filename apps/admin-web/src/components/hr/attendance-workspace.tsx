"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { SelfAttendanceSection } from "@/components/hr/self-attendance-page";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { hasAnyPermission } from "@/lib/permissions";

type AttendanceTab = "self" | "team";

export function AttendanceWorkspace({ teamAttendance }: { teamAttendance: ReactNode }) {
  const { t } = useI18n();
  const session = useCurrentUser();
  const access = attendanceWorkspaceAccess(session.data);
  const [activeTab, setActiveTab] = useState<AttendanceTab>(access.defaultTab);
  const selectedTab = access.canSelf && !access.canManage ? "self" : access.canManage && !access.canSelf ? "team" : activeTab;

  useEffect(() => setActiveTab(access.defaultTab), [access.defaultTab]);

  if (session.isLoading) return <LoadingState label={t("attendance.self.loadingToday")} />;
  if (!access.canSelf && !access.canManage) {
    return <div className="space-y-5"><PageHeader title={t("navigation.labels.hr.attendance")} description={t("attendance.self.description")} /><DetailCard title={t("attendance.workspace.noAccessTitle")}><p className="text-sm text-[var(--color-muted)]">{t("attendance.workspace.noAccessDescription")}</p></DetailCard></div>;
  }

  const tabs: Array<{ id: AttendanceTab; label: string }> = [
    ...(access.canSelf ? [{ id: "self" as const, label: t("attendance.self.title") }] : []),
    ...(access.canManage ? [{ id: "team" as const, label: t("attendance.workspace.teamAttendance") }] : []),
  ];

  return <div className="space-y-5">
    <PageHeader title={t("navigation.labels.hr.attendance")} description={access.canSelf ? t("attendance.self.description") : t("attendance.admin.description")} />
    {tabs.length > 1 ? <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-2" role="tablist" aria-label={t("navigation.labels.hr.attendance")}>{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={selectedTab === tab.id} className={`ui-button ${selectedTab === tab.id ? "ui-button-primary" : "ui-button-secondary"}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div> : null}
    {selectedTab === "self" && access.canSelf ? <SelfAttendanceSection /> : null}
    {selectedTab === "team" && access.canManage ? teamAttendance : null}
  </div>;
}

export function attendanceWorkspaceAccess(session: { permissions: string[]; hrEmployee?: { id: string; status: string; attendanceEnabled: boolean } | null } | undefined) {
  const canManage = hasAnyPermission(session, ["hr.attendance.view", "hr.attendance.manage", "hr.view", "hr.manage"]);
  const linkedEmployee = Boolean(session?.hrEmployee?.id && session.hrEmployee.status === "ACTIVE" && session.hrEmployee.attendanceEnabled);
  const canSelf = linkedEmployee || (!canManage && hasAnyPermission(session, ["hr.attendance.self"]));
  return { canManage, canSelf, defaultTab: canSelf ? "self" as const : "team" as const };
}
