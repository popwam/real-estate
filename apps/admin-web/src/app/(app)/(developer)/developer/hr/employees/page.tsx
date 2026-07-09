"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { employeePermissionKeys, listHrEmployeesApi } from "@/lib/hr-employees-api";

export default function DeveloperHrEmployeesPage() {
  const { t } = useI18n();
  const employees = useQuery({
    queryKey: ["hr-employees"],
    queryFn: listHrEmployeesApi,
  });

  return (
    <PagePermissionGuard permissions={["hr.employees.view", "hr.view", "hr.manage"]}>
      <PageHeader
        title={t("employeeAccess.title")}
        description={t("employeeAccess.description")}
        actions={
          <Link href="/developer/hr/employees/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("employeeAccess.addEmployee")}
            </Button>
          </Link>
        }
      />
      <div className="space-y-6">
        <FeedbackState
          tone="success"
          title={t("employeeAccess.separateAccountsTitle")}
          description={t("employeeAccess.doNotShareWarning")}
        />
        <DetailCard title={t("employeeAccess.employees")}>
          {employees.isLoading ? <LoadingState label={t("employeeAccess.loadingEmployees")} /> : null}
          {employees.error ? (
            <FeedbackState tone="error" title={t("employeeAccess.loadError")} description={employees.error.message} />
          ) : null}
          {!employees.isLoading && !employees.error && !employees.data?.length ? (
            <EmptyState
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              title={t("employeeAccess.emptyTitle")}
              description={t("employeeAccess.emptyDescription")}
              action={
                <Link href="/developer/hr/employees/new">
                  <Button>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("employeeAccess.createFirstEmployee")}
                  </Button>
                </Link>
              }
            />
          ) : null}
          {employees.data?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                <thead>
                  <tr>
                    <Header>{t("employeeAccess.employee")}</Header>
                    <Header>{t("employeeAccess.contact")}</Header>
                    <Header>{t("employeeAccess.role")}</Header>
                    <Header>{t("employeeAccess.permissions")}</Header>
                    <Header>{t("employeeAccess.status")}</Header>
                    <Header>{t("common.action")}</Header>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {employees.data.map((employee) => (
                    <tr key={employee.id}>
                      <Cell>
                        <p className="font-semibold text-[var(--color-foreground)]">{employee.name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{employee.roleTitle || t("common.notSet")}</p>
                      </Cell>
                      <Cell>
                        <p>{employee.email || employee.user?.email || t("common.notSet")}</p>
                        <p className="text-xs text-[var(--color-muted)]">{employee.phone || employee.user?.phone || t("common.notSet")}</p>
                      </Cell>
                      <Cell>{employee.user?.role?.name ? roleLabel(employee.user.role.name, t) : t("common.notSet")}</Cell>
                      <Cell>{t("employeeAccess.permissionCount", { count: employeePermissionKeys(employee).length })}</Cell>
                      <Cell>
                        <span className={employee.status === "ACTIVE" ? "text-emerald-700" : "text-zinc-500"}>
                          {employee.status === "ACTIVE" ? t("employeeAccess.active") : t("employeeAccess.inactive")}
                        </span>
                      </Cell>
                      <Cell>
                        <Link className="font-medium text-[var(--color-accent)] hover:underline" href={`/developer/hr/employees/${employee.id}`}>
                          {t("employeeAccess.manage")}
                        </Link>
                      </Cell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </DetailCard>
      </div>
    </PagePermissionGuard>
  );
}

function Header({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-left font-semibold text-[var(--color-muted)]">{children}</th>;
}

function Cell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-3 align-top text-[var(--color-foreground)]">{children}</td>;
}

function roleLabel(role: string, t: (key: string) => string) {
  const key = `employeeAccess.role.${role}`;
  const translated = t(key);
  return translated === key ? role.replaceAll("_", " ") : translated;
}
