"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarCheck,
  FileUp,
  KeyRound,
  MapPinned,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  UserPlus,
  UsersRound,
  Wifi,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { EmployeeForm, type EmployeeFormValues } from "@/components/hr/employee-form";
import { HrEmployeeImage } from "@/components/hr/hr-employee-image";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { listOrganizationsApi } from "@/lib/api";
import {
  getQuickActionPreferenceApi,
  resetQuickActionPreferenceApi,
  saveQuickActionPreferenceApi,
} from "@/lib/user-preferences-api";
import {
  applyHrEmployeeActionApi,
  createHrEmployeeApi,
  getHrEmployeeApi,
  getHrOrgChartApi,
  getHrSummaryApi,
  listHrEmployeeDocumentsApi,
  listHrEmployeesApi,
  listHrTeamsApi,
  listHrTitleChangesApi,
  listHrTransferLogApi,
  listHrWorkGroupsApi,
  resetHrEmployeePasswordApi,
  saveHrTeamApi,
  saveHrWorkGroupApi,
  setHrEmployeeActiveApi,
  updateHrEmployeeApi,
  updateHrEmployeePermissionsApi,
  updateHrEmployeeRoleApi,
  type HrEmployee,
  type HrEmployeeDocument,
  type HrEmployeeFilters,
  type HrTeam,
  type HrWorkGroup,
} from "@/lib/hr-employees-api";
import { isPlatformRole } from "@/lib/permissions";

const defaultEmployeeFilters: HrEmployeeFilters = { page: 1, pageSize: 10 };

type WorkGroupOrTeam = (HrWorkGroup | HrTeam) & {
  managers?: Array<{ user?: { email?: string | null } | null }>;
  manager?: { email?: string | null } | null;
  workScheduleId?: string | null;
  attendanceProfileId?: string | null;
  _count?: { employees: number };
};

type LogRecord = {
  id?: string;
  employee?: { name?: string | null } | null;
  reason?: string | null;
  effectiveDate?: string | null;
};

export function HrDashboardPage() {
  const { t, formatNumber } = useI18n();
  const { organizationId, organizationSelector } = useHrOrganizationFilter();
  const summary = useQuery({
    queryKey: ["hr-summary", organizationId],
    queryFn: () => getHrSummaryApi({ organizationId: organizationId || undefined }),
  });

  const cards = [
    ["totalEmployees", "hr.dashboard.totalEmployees"],
    ["activeEmployees", "hr.dashboard.activeEmployees"],
    ["onLeaveToday", "hr.dashboard.onLeaveToday"],
    ["presentToday", "hr.dashboard.presentToday"],
    ["lateToday", "hr.dashboard.lateToday"],
    ["pendingRequests", "hr.dashboard.pendingRequests"],
    ["missingDocuments", "hr.dashboard.missingDocuments"],
    ["expiredDocuments", "hr.dashboard.expiredDocuments"],
    ["newHiresThisMonth", "hr.dashboard.newHiresThisMonth"],
    ["employeesUnderProbation", "hr.dashboard.underProbation"],
    ["employeesWithoutLoginAccess", "hr.dashboard.withoutLogin"],
    ["employeesMissingFaceReferencePhoto", "hr.dashboard.missingFace"],
  ] as const;

  return (
    <PagePermissionGuard permissions={["hr.dashboard.view", "hr.view"]}>
      <HrQuickActions />
      <PageHeader title={t("hr.dashboard.title")} description={t("hr.dashboard.description")} actions={organizationSelector} />
      {summary.isLoading ? <LoadingState label={t("hr.loading")} /> : null}
      {summary.error ? <FeedbackState tone="error" title={t("hr.loadError")} description={summary.error.message} /> : null}
      {summary.data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([key, labelKey]) => (
            <DetailCard key={key} title={t(labelKey)}>
              <p className="text-3xl font-semibold text-[var(--color-foreground)]">{formatNumber(Number(summary.data[key] ?? 0))}</p>
            </DetailCard>
          ))}
        </div>
      ) : null}
    </PagePermissionGuard>
  );
}

export function HrEmployeesPage() {
  const { t, formatDate } = useI18n();
  const { organizationId, organizationSelector } = useHrOrganizationFilter();
  const [filters, setFilters] = useState<HrEmployeeFilters>(defaultEmployeeFilters);
  const [modal, setModal] = useState<{ title: string; body: ReactNode } | null>(null);
  const query = useQuery({
    queryKey: ["hr-employees", organizationId, filters],
    queryFn: () => listHrEmployeesApi({ ...filters, organizationId: organizationId || undefined }),
  });
  const page = query.data?.page ?? 1;
  const pageSize = query.data?.pageSize ?? 10;
  const total = query.data?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  function setFilter(key: string, value: string | boolean | number | undefined) {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? Number(value) : 1 }));
  }

  return (
    <PagePermissionGuard permissions={["hr.employees.view"]}>
      <HrQuickActions />
      <PageHeader
        title={t("hr.employees.title")}
        description={t("hr.employees.description")}
        actions={
          <div className="flex flex-wrap gap-2">
            {organizationSelector}
            <Link href="/hr/employees/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("employeeAccess.addEmployee")}
              </Button>
            </Link>
          </div>
        }
      />
      <div className="space-y-6">
        <DetailCard title={t("hr.filters.title")}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["officeId", "hr360.office"],
              ["branchId", "hr360.branch"],
              ["departmentId", "employeeAccess.department"],
              ["positionId", "hr360.position"],
              ["jobLevelId", "hr360.jobLevel"],
              ["role", "hr.filters.roleAccess"],
              ["directManagerId", "hr360.directManager"],
              ["secondaryManagerId", "hr360.secondaryManager"],
              ["nationalityCountryCode", "hr360.nationality"],
              ["residenceCountryCode", "hr360.countryOfResidence"],
              ["employmentType", "hr360.employmentType"],
              ["status", "employeeAccess.status"],
              ["todayStatus", "hr.filters.todayStatus"],
              ["search", "hr.filters.additionalSearch"],
            ].map(([key, label]) => (
              <label key={key} className="grid gap-1.5 text-sm">
                <span className="font-medium text-[var(--color-foreground)]">{t(label)}</span>
                <Input value={String(filters[key] ?? "")} onChange={(event) => setFilter(key, event.target.value)} />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.loginEnabled === true} onChange={(event) => setFilter("loginEnabled", event.target.checked ? true : undefined)} />
              {t("hr.filters.loginEnabled")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.isUnderProbation === true} onChange={(event) => setFilter("isUnderProbation", event.target.checked ? true : undefined)} />
              {t("hr.filters.underProbation")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.hasDisability === true} onChange={(event) => setFilter("hasDisability", event.target.checked ? true : undefined)} />
              {t("hr.filters.hasDisability")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.missingDocuments === true} onChange={(event) => setFilter("missingDocuments", event.target.checked ? true : undefined)} />
              {t("hr.filters.missingDocuments")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.expiredDocuments === true} onChange={(event) => setFilter("expiredDocuments", event.target.checked ? true : undefined)} />
              {t("hr.filters.expiredDocuments")}
            </label>
          </div>
        </DetailCard>

        {query.isLoading ? <LoadingState label={t("employeeAccess.loadingEmployees")} /> : null}
        {query.error ? <FeedbackState tone="error" title={t("employeeAccess.loadError")} description={query.error.message} /> : null}
        {!query.isLoading && !query.data?.items.length ? (
          <EmptyState icon={<UsersRound className="h-5 w-5" aria-hidden="true" />} title={t("employeeAccess.emptyTitle")} description={t("employeeAccess.emptyDescription")} />
        ) : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {(query.data?.items ?? []).map((employee) => (
            <article key={employee.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start gap-4">
                <HrEmployeeImage fileId={employee.photoFileId} alt={employee.displayName || employee.name} initials={employeeInitials(employee)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[var(--color-foreground)]">{employee.displayName || employee.name}</h2>
                    <span className="rounded bg-[var(--color-surface-muted)] px-2 py-1 text-xs text-[var(--color-muted)]">{employee.employeeCode || t("common.notSet")}</span>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">{employee.jobTitle || employee.roleTitle || t("common.notSet")}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <Info label={t("employeeAccess.department")} value={employee.department?.name || employee.departmentId || t("common.notSet")} />
                <Info label={t("hr360.office")} value={employee.office?.name || employee.branch?.name || employee.officeId || t("common.notSet")} />
                <Info label={t("hr.card.todayStatus")} value={statusLabel(employee.todayAttendanceStatus, t)} />
                <Info label={t("hr.card.checkIn")} value={employee.checkInTime ? formatDate(employee.checkInTime, { timeStyle: "short" }) : t("common.notSet")} />
                <Info label={t("hr.card.checkOut")} value={employee.checkOutTime ? formatDate(employee.checkOutTime, { timeStyle: "short" }) : t("common.notSet")} />
                <Info label={t("hr360.allowEmployeeLogin")} value={employee.loginEnabled ? t("common.enabled") : t("common.disabled")} />
                <Info label={t("employeeAccess.status")} value={employee.status === "ACTIVE" ? t("employeeAccess.active") : t("employeeAccess.inactive")} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["contact", "hr.quick.contact"],
                  ["info", "hr.quick.employeeInfo"],
                  ["transfer", "hr.quick.transfer"],
                  ["audit", "hr.quick.auditTrail"],
                  ["history", "hr.quick.officeHistory"],
                  ["suspend", "hr.quick.suspend"],
                  ["delete", "hr.quick.delete"],
                  ["reset", "hr.quick.resetPassword"],
                  ["documents", "hr.quick.documents"],
                  ["permissions", "hr.quick.permissions"],
                ].map(([id, label]) => (
                  <Button key={id} className="ui-button-secondary text-xs" onClick={() => setModal(employeeModal(id, employee, t))}>
                    {t(label)}
                  </Button>
                ))}
                <Link href={`/hr/employees/${employee.id}`} className="ui-button ui-button-primary text-xs">{t("employeeAccess.manage")}</Link>
              </div>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted)]">{t("hr.pagination", { page, maxPage, total })}</p>
          <div className="flex gap-2">
            <Button className="ui-button-secondary" disabled={page <= 1} onClick={() => setFilter("page", page - 1)}>{t("common.previous")}</Button>
            <Button className="ui-button-secondary" disabled={page >= maxPage} onClick={() => setFilter("page", page + 1)}>{t("common.next")}</Button>
          </div>
        </div>
      </div>
      {modal ? <HrModal title={modal.title} onClose={() => setModal(null)}>{modal.body}</HrModal> : null}
    </PagePermissionGuard>
  );
}

export function NewHrEmployeePage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [createdEmployee, setCreatedEmployee] = useState<HrEmployee | null>(null);
  const create = useMutation({
    mutationFn: createHrEmployeeApi,
    onSuccess: async (employee) => {
      await queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      setCreatedEmployee(employee);
    },
  });

  return (
    <PagePermissionGuard permissions={["hr.employees.create", "hr.manage"]}>
      <HrQuickActions />
      <PageHeader title={t("employeeAccess.newTitle")} description={t("hr360.newDescription")} />
      <div className="space-y-6">
        <EmployeeForm mode="create" isSaving={create.isPending} onSubmit={async (values) => { await create.mutateAsync(values); }} />
        {createdEmployee ? (
          <FeedbackState tone="success" title={t("employeeAccess.createdPasswordTitle")} description={t("employeeAccess.createdPasswordDescription", { password: "123456" })} action={<Link href={`/hr/employees/${createdEmployee.id}`}><Button className="ui-button-secondary">{t("employeeAccess.viewEmployee")}</Button></Link>} />
        ) : null}
        {create.error ? <FeedbackState tone="error" title={t("employeeAccess.createError")} description={create.error.message} /> : null}
      </div>
    </PagePermissionGuard>
  );
}

export function HrEmployeeDetailPage({ id }: { id: string }) {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const [generatedPassword, setGeneratedPassword] = useState("");
  const employee = useQuery({ queryKey: ["hr-employee", id], queryFn: () => getHrEmployeeApi(id) });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
    await queryClient.invalidateQueries({ queryKey: ["hr-employee", id] });
  };
  const update = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      await updateHrEmployeeApi(id, values);
      await updateHrEmployeeRoleApi(id, values.role ?? "employee_self_service");
      await updateHrEmployeePermissionsApi(id, values.permissions);
    },
    onSuccess: refresh,
  });
  const reset = useMutation({
    mutationFn: () => resetHrEmployeePasswordApi(id, "123456"),
    onSuccess: async (result) => {
      setGeneratedPassword(result.temporaryPassword ?? "123456");
      await refresh();
    },
  });
  const active = useMutation({ mutationFn: (next: boolean) => setHrEmployeeActiveApi(id, next), onSuccess: refresh });
  const loginAccess = useMutation({
    mutationFn: (enabled: boolean) => updateHrEmployeeApi(id, { loginEnabled: enabled, allowLogin: enabled, temporaryPassword: enabled ? "123456" : undefined }),
    onSuccess: refresh,
  });

  return (
    <PagePermissionGuard permissions={["hr.employees.view", "hr.view"]}>
      <HrQuickActions />
      <PageHeader title={t("employeeAccess.detailTitle")} description={t("hr360.detailDescription")} />
      {employee.isLoading ? <LoadingState label={t("employeeAccess.loadingEmployee")} /> : null}
      {employee.error ? <FeedbackState tone="error" title={t("employeeAccess.loadError")} description={employee.error.message} /> : null}
      {employee.data ? (
        <div className="space-y-6">
          <DetailCard
            title={t("employeeAccess.currentAccess")}
            actions={
              <>
                <Button className="ui-button-secondary" onClick={() => reset.mutate()} disabled={reset.isPending}>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {t("employeeAccess.resetPassword")}
                </Button>
                <Button className="ui-button-secondary" onClick={() => active.mutate(employee.data?.status !== "ACTIVE")} disabled={active.isPending}>
                  {employee.data.status === "ACTIVE" ? t("employeeAccess.deactivate") : t("employeeAccess.activate")}
                </Button>
              </>
            }
          >
            <DetailGrid
              items={[
                { label: t("employeeAccess.employee"), value: employee.data.displayName || employee.data.name },
                { label: t("hr360.employeeCode"), value: employee.data.employeeCode || t("common.notSet") },
                { label: t("employeeAccess.organization"), value: employee.data.organization?.name },
                { label: t("employeeAccess.email"), value: employee.data.email ?? employee.data.user?.email },
                { label: t("employeeAccess.phone"), value: employee.data.phone ?? employee.data.user?.phone },
                { label: t("employeeAccess.status"), value: employee.data.status === "ACTIVE" ? t("employeeAccess.active") : t("employeeAccess.inactive") },
                { label: t("hr360.loginEnabled"), value: employee.data.loginEnabled ? t("hr360.loginEnabled") : t("hr360.loginDisabled") },
                { label: t("hr360.mustChangePassword"), value: employee.data.user?.mustChangePassword ? t("common.yes") : t("common.no") },
                { label: t("hr360.lastLogin"), value: employee.data.user?.lastLoginAt ? formatDate(employee.data.user.lastLoginAt, { dateStyle: "medium", timeStyle: "short" }) : t("common.notSet") },
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="ui-button-secondary" onClick={() => loginAccess.mutate(true)} disabled={loginAccess.isPending || Boolean(employee.data.loginEnabled)}>
                {t("hr360.enableLogin")}
              </Button>
              <Button className="ui-button-secondary" onClick={() => loginAccess.mutate(false)} disabled={loginAccess.isPending || !employee.data.loginEnabled}>
                {t("hr360.disableLogin")}
              </Button>
            </div>
          </DetailCard>
          {generatedPassword ? <FeedbackState tone="success" title={t("employeeAccess.generatedPasswordTitle")} description={t("employeeAccess.generatedPasswordDescription", { password: generatedPassword })} /> : null}
          {employee.data.loginReadiness && !employee.data.loginReadiness.canLogin ? (
            <FeedbackState tone="error" title={t("employeeAccess.loginNotReadyTitle")} description={employee.data.loginReadiness.reasons.join(" ")} />
          ) : null}
          <EmployeeForm mode="edit" employee={employee.data} isSaving={update.isPending} onSubmit={(values) => update.mutateAsync(values)} />
          {update.error ? <FeedbackState tone="error" title={t("employeeAccess.updateError")} description={update.error.message} /> : null}
        </div>
      ) : null}
    </PagePermissionGuard>
  );
}

export function HrWorkGroupsPage() {
  return <NamedCollectionPage type="work-groups" titleKey="hr.workGroups.title" descriptionKey="hr.workGroups.description" permission="hr.work_groups.view" managePermission="hr.work_groups.manage" />;
}

export function HrTeamsPage() {
  return <NamedCollectionPage type="teams" titleKey="hr.teams.title" descriptionKey="hr.teams.description" permission="hr.teams.view" managePermission="hr.teams.manage" />;
}

function NamedCollectionPage({ type, titleKey, descriptionKey, permission, managePermission }: { type: "work-groups" | "teams"; titleKey: string; descriptionKey: string; permission: string; managePermission: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { organizationId, organizationSelector } = useHrOrganizationFilter();
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");
  const query = useQuery({
    queryKey: [type, organizationId],
    queryFn: () => (type === "work-groups" ? listHrWorkGroupsApi({ organizationId: organizationId || undefined }) : listHrTeamsApi({ organizationId: organizationId || undefined })),
  });
  const save = useMutation({
    mutationFn: () =>
      type === "work-groups"
        ? saveHrWorkGroupApi({ name, managerIds: managerId ? [managerId] : [], organizationId: organizationId || undefined })
        : saveHrTeamApi({ name, managerId: managerId || undefined, organizationId: organizationId || undefined }),
    onSuccess: async () => {
      setName("");
      setManagerId("");
      await queryClient.invalidateQueries({ queryKey: [type] });
    },
  });
  return (
    <PagePermissionGuard permissions={[permission]}>
      <HrQuickActions />
      <PageHeader title={t(titleKey)} description={t(descriptionKey)} actions={organizationSelector} />
      <div className="space-y-6">
        <PagePermissionGuard permissions={[managePermission]}>
          <DetailCard title={t("hr.addNew")}>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input placeholder={t("hr.name")} value={name} onChange={(event) => setName(event.target.value)} />
              <Input placeholder={t("hr.managerId")} value={managerId} onChange={(event) => setManagerId(event.target.value)} />
              <Button onClick={() => save.mutate()} disabled={!name || save.isPending}>{t("common.save")}</Button>
            </div>
          </DetailCard>
        </PagePermissionGuard>
        <DetailCard title={t("hr.records")}>
          {query.isLoading ? <LoadingState label={t("hr.loading")} /> : null}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr><Th>{t("hr.name")}</Th><Th>{t("hr.manager")}</Th><Th>{t("hr.employeeCount")}</Th><Th>{t("hr.workSchedule")}</Th><Th>{t("hr.attendanceProfile")}</Th><Th>{t("employeeAccess.status")}</Th><Th>{t("common.action")}</Th></tr></thead>
              <tbody>
                {((query.data ?? []) as WorkGroupOrTeam[]).map((item) => (
                  <tr key={item.id} className="border-t border-[var(--color-border)]">
                    <Td>{item.name}</Td>
                    <Td>{item.manager?.email || item.managers?.map((entry) => entry.user?.email).filter(Boolean).join(", ") || t("common.notSet")}</Td>
                    <Td>{item._count?.employees ?? 0}</Td>
                    <Td>{item.workScheduleId || t("common.notSet")}</Td>
                    <Td>{item.attendanceProfileId || t("common.notSet")}</Td>
                    <Td>{item.isActive ? t("employeeAccess.active") : t("employeeAccess.inactive")}</Td>
                    <Td><Button className="ui-button-secondary text-xs" disabled title={t("hr.buttonNotAvailableYet")}>{t("hr.comingSoon")}</Button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailCard>
      </div>
    </PagePermissionGuard>
  );
}

export function HrEmployeeActionsPage() {
  const { t } = useI18n();
  const [action, setAction] = useState("assign_access_level");
  const [employeeIds, setEmployeeIds] = useState("");
  const [details, setDetails] = useState("");
  const apply = useMutation({
    mutationFn: () => applyHrEmployeeActionApi({ action, employeeIds: employeeIds.split(",").map((item) => item.trim()).filter(Boolean), details: parseJson(details) }),
  });
  const actions = ["assign_access_level", "change_department", "change_position", "change_direct_manager", "change_secondary_manager", "transfer_employee", "assign_temporary_password", "activate", "deactivate", "bulk_update_permissions", "finalize_payment", "add_grace_minutes"];
  return (
    <PagePermissionGuard permissions={["hr.actions.view", "hr.actions.apply"]}>
      <HrQuickActions />
      <PageHeader title={t("hr.actions.title")} description={t("hr.actions.description")} />
      <DetailCard title={t("hr.actions.wizard")}>
        <div className="grid gap-4">
          <select className="ui-input" value={action} onChange={(event) => setAction(event.target.value)}>{actions.map((item) => <option key={item} value={item}>{t(`hr.action.${item}`)}</option>)}</select>
          <Input placeholder={t("hr.actions.employeeIds")} value={employeeIds} onChange={(event) => setEmployeeIds(event.target.value)} />
          <textarea className="ui-input min-h-32" placeholder={t("hr.actions.detailsJson")} value={details} onChange={(event) => setDetails(event.target.value)} />
          <Button onClick={() => apply.mutate()}>{t("hr.actions.apply")}</Button>
          {apply.data ? <FeedbackState tone="success" title={apply.data.applied ? t("hr.actions.applied") : t("hr.comingSoon")} description={t("hr.actions.affected", { count: apply.data.affectedEmployees })} /> : null}
          {apply.error ? <FeedbackState tone="error" title={t("hr.loadError")} description={apply.error.message} /> : null}
        </div>
      </DetailCard>
    </PagePermissionGuard>
  );
}

export function HrEmployeeDocumentsPage() {
  const { t } = useI18n();
  const { organizationId, organizationSelector } = useHrOrganizationFilter();
  const docs = useQuery({ queryKey: ["hr-documents", organizationId], queryFn: () => listHrEmployeeDocumentsApi({ organizationId: organizationId || undefined }) });
  return (
    <PagePermissionGuard permissions={["hr.documents.view"]}>
      <HrQuickActions />
      <PageHeader title={t("hr.documents.title")} description={t("hr.documents.description")} actions={organizationSelector} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DocumentSection title={t("hr.documents.missing")} docs={(docs.data ?? []).filter((doc) => doc.status === "MISSING")} />
        <DocumentSection title={t("hr.documents.expired")} docs={(docs.data ?? []).filter((doc) => doc.status === "EXPIRED" || (doc.expiresAt && new Date(doc.expiresAt) < new Date()))} />
      </div>
    </PagePermissionGuard>
  );
}

export function HrOrgChartPage() {
  const { t } = useI18n();
  const { organizationId, organizationSelector } = useHrOrganizationFilter();
  const chart = useQuery({ queryKey: ["hr-org-chart", organizationId], queryFn: () => getHrOrgChartApi({ organizationId: organizationId || undefined }) });
  const employees = (chart.data?.employees as HrEmployee[] | undefined) ?? [];
  return (
    <PagePermissionGuard permissions={["hr.org_chart.view"]}>
      <HrQuickActions />
      <PageHeader title={t("hr.orgChart.title")} description={t("hr.orgChart.description")} actions={organizationSelector} />
      <DetailCard title={t("hr.orgChart.tree")}>
        {chart.isLoading ? <LoadingState label={t("hr.loading")} /> : null}
        <div className="grid gap-3">
          {employees.map((employee) => (
            <div key={employee.id} className="rounded-md border border-[var(--color-border)] p-3 text-sm">
              <strong>{employee.name}</strong>
              <span className="text-[var(--color-muted)]"> - {employee.jobTitle || employee.roleTitle || t("common.notSet")}</span>
            </div>
          ))}
        </div>
      </DetailCard>
    </PagePermissionGuard>
  );
}

export function HrLogPage({ type }: { type: "transfer" | "title" }) {
  const { t } = useI18n();
  const { organizationId, organizationSelector } = useHrOrganizationFilter();
  const query = useQuery({
    queryKey: [`hr-${type}-log`, organizationId],
    queryFn: () => type === "transfer" ? listHrTransferLogApi({ organizationId: organizationId || undefined }) : listHrTitleChangesApi({ organizationId: organizationId || undefined }),
  });
  return (
    <PagePermissionGuard permissions={[type === "transfer" ? "hr.transfer_log.view" : "hr.title_changes.view"]}>
      <HrQuickActions />
      <PageHeader title={t(type === "transfer" ? "hr.transferLog.title" : "hr.titleChanges.title")} description={t(type === "transfer" ? "hr.transferLog.description" : "hr.titleChanges.description")} actions={organizationSelector} />
      <DetailCard title={t("hr.records")}>
        <div className="grid gap-3">
          {(query.data ?? []).map((item) => (
            <div key={String(item.id)} className="rounded-md border border-[var(--color-border)] p-3 text-sm">
              <strong>{(item as LogRecord).employee?.name ?? t("employeeAccess.employee")}</strong>
              <p className="text-[var(--color-muted)]">{String(item.reason ?? item.effectiveDate ?? "")}</p>
            </div>
          ))}
        </div>
      </DetailCard>
    </PagePermissionGuard>
  );
}

export function HrFoundationPage({ pageKey, permission, sections }: { pageKey: string; permission: string; sections: string[] }) {
  const { t } = useI18n();
  return (
    <PagePermissionGuard permissions={[permission]}>
      <HrQuickActions />
      <PageHeader title={t(`hr.foundation.${pageKey}.title`)} description={t(`hr.foundation.${pageKey}.description`)} />
      <DetailCard title={t("hr.foundation.availableSections")}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <div key={section} className="rounded-md border border-[var(--color-border)] p-4">
              <p className="font-semibold text-[var(--color-foreground)]">{t(`hr.foundation.section.${section}`)}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{t("hr.foundation.comingSoonDescription")}</p>
            </div>
          ))}
        </div>
      </DetailCard>
    </PagePermissionGuard>
  );
}

function HrQuickActions() {
  const { t, direction } = useI18n();
  const router = useRouter();
  const { data } = useCurrentUser();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const canCustomize = data?.permissions.includes("quick_actions.customize");
  const actions = [
    { id: "addEmployee", href: "/hr/employees/new", icon: UserPlus, permissions: ["hr.employees.create"] },
    { id: "addApplicant", href: "/hr/recruitment/applicants/new", icon: UsersRound, permissions: ["hr.recruitment.applicants.manage"] },
    { id: "openAttendance", href: "/hr/attendance", icon: CalendarCheck, permissions: ["hr.attendance.view", "hr.attendance.manage"] },
    { id: "addOffice", href: "/platform/organizations", icon: MapPinned, permissions: ["company.offices.manage", "platform.organizations.manage"] },
    { id: "addWifiRule", href: "/platform/organizations", icon: Wifi, permissions: ["company.wifi_rules.manage", "platform.organizations.manage"] },
    { id: "addAccessLevel", href: "/platform/organizations", icon: ShieldCheck, permissions: ["company.access_levels.manage", "platform.organizations.manage"] },
    { id: "createHrRequest", href: "/hr/requests", icon: BriefcaseBusiness, permissions: ["hr.requests.manage", "hr.actions.apply"] },
    { id: "uploadHrDocument", href: "/hr/documents", icon: FileUp, permissions: ["hr.documents.manage"] },
    { id: "openHrSettings", href: "/hr/settings", icon: Settings2, permissions: ["hr.settings.view"] },
    { id: "openCompanyOffices", href: "/platform/organizations", icon: MapPinned, permissions: ["company.offices.view", "platform.organizations.view"] },
    { id: "openCompanyAttendanceSettings", href: "/hr/settings", icon: CalendarCheck, permissions: ["company.attendance_settings.view", "hr.settings.view"] },
  ];
  const allowedActions = actions.filter((action) => action.permissions.some((permission) => data?.permissions.includes(permission) || (permission.startsWith("hr.") && data?.permissions.includes("hr.manage"))));

  useEffect(() => {
    getQuickActionPreferenceApi("hr")
      .then((preference) => {
        const savedPosition = preference?.position;
        if (typeof savedPosition?.x === "number" && typeof savedPosition?.y === "number") setPosition({ x: savedPosition.x, y: savedPosition.y });
        setOpen(!preference?.isCollapsed);
      })
      .catch(() => undefined);
  }, []);

  function persist(nextPosition = position, nextOpen = open) {
    if (!canCustomize) return;
    void saveQuickActionPreferenceApi("hr", {
      position: nextPosition ?? {},
      isCollapsed: !nextOpen,
      selectedActions: allowedActions.map((action) => action.id),
    }).catch(() => undefined);
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = {
      x: Math.max(8, Math.min(window.innerWidth - 220, event.clientX - dragOffset.current.x)),
      y: Math.max(8, Math.min(window.innerHeight - 80, event.clientY - dragOffset.current.y)),
    };
    setPosition(next);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    persist(position, open);
  }

  function resetPosition() {
    setPosition(null);
    setOpen(false);
    void resetQuickActionPreferenceApi("hr").catch(() => undefined);
  }

  return (
    <div
      ref={buttonRef}
      className="fixed z-20"
      style={position ? { left: position.x, top: position.y } : { bottom: "calc(var(--bottom-nav-height) + 1rem)", [direction === "rtl" ? "left" : "right"]: "1rem" }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 24 : 8;
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const current = position ?? { x: direction === "rtl" ? 16 : window.innerWidth - 220, y: window.innerHeight - 96 };
        const next = {
          x: current.x + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0),
          y: current.y + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0),
        };
        setPosition(next);
        persist(next, open);
      }}
    >
      <div>
        <button
          type="button"
          className="ui-button ui-button-primary cursor-move shadow-lg"
          onClick={() => {
            const nextOpen = !open;
            setOpen(nextOpen);
            persist(position, nextOpen);
          }}
          aria-expanded={open}
          aria-label={t("hr.quickActions")}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("hr.quickActions")}
        </button>
        {open ? (
          <div className="mt-2 grid w-72 gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg">
            {allowedActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(`hr.quickAction.${action.id}`)}
                </button>
              );
            })}
            <button className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-70" type="button" disabled title={t("hr.buttonNotAvailableYet")}>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {t("hr.quickAction.futureIntegration")} - {t("hr.comingSoon")}
            </button>
            <button type="button" onClick={resetPosition} className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("hr.quickAction.resetPosition")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function useHrOrganizationFilter() {
  const { t } = useI18n();
  const { data } = useCurrentUser();
  const isPlatform = isPlatformRole(data?.user.role);
  const [organizationId, setOrganizationId] = useState("");
  const organizations = useQuery({ queryKey: ["organizations", "hr-filter"], queryFn: listOrganizationsApi, enabled: isPlatform });
  const defaultOrganizationId = organizations.data?.find((organization) => organization.type !== "PLATFORM")?.id ?? "";
  const selectedOrganizationId = isPlatform ? organizationId || defaultOrganizationId : "";
  const organizationSelector = isPlatform ? (
    <select className="ui-input min-w-52" value={selectedOrganizationId} onChange={(event) => setOrganizationId(event.target.value)} aria-label={t("employeeAccess.organization")}>
      <option value="">{t("employeeAccess.selectOrganization")}</option>
      {(organizations.data ?? []).filter((organization) => organization.type !== "PLATFORM").map((organization) => (
        <option key={organization.id} value={organization.id}>{organization.name}</option>
      ))}
    </select>
  ) : null;
  return { organizationId: selectedOrganizationId, organizationSelector };
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-xs font-semibold uppercase text-[var(--color-muted)]">{label}</p><p className="text-[var(--color-foreground)]">{value}</p></div>;
}

function DocumentSection({ title, docs }: { title: string; docs: HrEmployeeDocument[] }) {
  const { t } = useI18n();
  return (
    <DetailCard title={title}>
      <div className="grid gap-3">
        {docs.length ? docs.map((doc) => (
          <div key={doc.id} className="rounded-md border border-[var(--color-border)] p-3 text-sm">
            <p className="font-semibold">{doc.employee?.name ?? t("employeeAccess.employee")}</p>
            <p className="text-[var(--color-muted)]">{doc.documentType} - {t(`hr360.option.${doc.aiReviewStatus ?? "NOT_REVIEWED"}`)}</p>
            <Button className="ui-button-secondary mt-2 text-xs" disabled title={t("hr.buttonNotAvailableYet")}>{t("hr.documents.upload")}</Button>
          </div>
        )) : <p className="text-sm text-[var(--color-muted)]">{t("hr.documents.none")}</p>}
      </div>
    </DetailCard>
  );
}

function HrModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
      <section className="w-full max-w-xl rounded-md bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="font-semibold">{title}</h2>
          <Button className="ui-button-secondary" onClick={onClose}>{t("common.close")}</Button>
        </div>
        <div className="p-4">{children}</div>
      </section>
    </div>
  );
}

function employeeModal(id: string, employee: HrEmployee, t: (key: string, params?: Record<string, string | number>) => string) {
  const protectedText = id === "delete" || id === "suspend" ? t("hr.quick.protectedAction") : t("hr.quick.comingSoonDetail");
  return {
    title: t(`hr.quick.${id}`),
    body: (
      <DetailGrid
        items={[
          { label: t("employeeAccess.employee"), value: employee.name },
          { label: t("employeeAccess.email"), value: employee.email || employee.user?.email || t("common.notSet") },
          { label: t("employeeAccess.phone"), value: employee.phone || employee.user?.phone || t("common.notSet") },
          { label: t("employeeAccess.status"), value: employee.status },
          { label: t("common.note"), value: protectedText },
        ]}
      />
    ),
  };
}

function statusLabel(status: string | undefined, t: (key: string) => string) {
  return status ? t(`hr.todayStatus.${status}`) : t("hr.todayStatus.ABSENT");
}

function employeeInitials(employee: HrEmployee) {
  return (employee.displayName || employee.name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-left font-semibold text-[var(--color-muted)]">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-3 py-3 align-top text-[var(--color-foreground)]">{children}</td>;
}

function parseJson(value: string) {
  if (!value.trim()) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
