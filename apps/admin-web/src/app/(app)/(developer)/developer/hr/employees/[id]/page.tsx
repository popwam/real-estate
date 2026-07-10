"use client";

import { useState } from "react";
import { KeyRound, Power, PowerOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedbackState } from "@/components/feedback-state";
import { EmployeeForm, type EmployeeFormValues } from "@/components/hr/employee-form";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/loading-state";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import {
  employeePermissionKeys,
  getHrEmployeeApi,
  resetHrEmployeePasswordApi,
  setHrEmployeeActiveApi,
  updateHrEmployeeApi,
  updateHrEmployeePermissionsApi,
  updateHrEmployeeRoleApi,
} from "@/lib/hr-employees-api";

export default function HrEmployeeDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [resetPassword, setResetPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const employee = useQuery({
    queryKey: ["hr-employee", id],
    queryFn: () => getHrEmployeeApi(id),
  });

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

  const active = useMutation({
    mutationFn: (nextActive: boolean) => setHrEmployeeActiveApi(id, nextActive),
    onSuccess: refresh,
  });

  const reset = useMutation({
    mutationFn: () => resetHrEmployeePasswordApi(id, resetPassword || undefined),
    onSuccess: async (result) => {
      setGeneratedPassword(result.temporaryPassword ?? "");
      setResetPassword("");
      await refresh();
    },
  });

  return (
    <PagePermissionGuard permissions={["hr.employees.view", "hr.view", "hr.manage"]}>
      <PageHeader title={t("employeeAccess.detailTitle")} description={t("employeeAccess.detailDescription")} />
      {employee.isLoading ? <LoadingState label={t("employeeAccess.loadingEmployee")} /> : null}
      {employee.error ? <FeedbackState tone="error" title={t("employeeAccess.loadError")} description={employee.error.message} /> : null}
      {employee.data ? (
        <div className="space-y-6">
          <DetailCard title={t("employeeAccess.currentAccess")}>
            <DetailGrid
              items={[
                { label: t("employeeAccess.employee"), value: employee.data.name },
                { label: t("employeeAccess.organization"), value: employee.data.organization?.name },
                { label: t("employeeAccess.email"), value: employee.data.email ?? employee.data.user?.email },
                { label: t("employeeAccess.phone"), value: employee.data.phone ?? employee.data.user?.phone },
                { label: t("employeeAccess.role"), value: employee.data.user?.role?.name ? roleLabel(employee.data.user.role.name, t) : t("common.notSet") },
                { label: t("employeeAccess.status"), value: employee.data.status === "ACTIVE" ? t("employeeAccess.active") : t("employeeAccess.inactive") },
                { label: t("employeeAccess.permissions"), value: t("employeeAccess.permissionCount", { count: employeePermissionKeys(employee.data).length }) },
              ]}
            />
          </DetailCard>
          {employee.data.loginReadiness && !employee.data.loginReadiness.canLogin ? (
            <FeedbackState
              tone="error"
              title={t("employeeAccess.loginNotReadyTitle")}
              description={employee.data.loginReadiness.reasons.map((reason) => loginReadinessLabel(reason, t)).join(" ")}
            />
          ) : null}

          <EmployeeForm
            mode="edit"
            employee={employee.data}
            isSaving={update.isPending}
            onSubmit={(values) => update.mutateAsync(values)}
          />
          {update.error ? <FeedbackState tone="error" title={t("employeeAccess.updateError")} description={update.error.message} /> : null}

          <DetailCard
            title={t("employeeAccess.accountActions")}
            actions={
              <Button className="ui-button-secondary" onClick={() => active.mutate(employee.data?.status !== "ACTIVE")} disabled={active.isPending}>
                {employee.data.status === "ACTIVE" ? <PowerOff className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
                {employee.data.status === "ACTIVE" ? t("employeeAccess.deactivate") : t("employeeAccess.activate")}
              </Button>
            }
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="grid gap-1.5">
                <Label htmlFor="resetPassword">{t("employeeAccess.resetPassword")}</Label>
                <Input
                  id="resetPassword"
                  type="password"
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder={t("employeeAccess.generatedIfBlank")}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => reset.mutate()} disabled={reset.isPending}>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {reset.isPending ? t("common.saving") : t("employeeAccess.resetPassword")}
                </Button>
              </div>
            </div>
            {generatedPassword ? (
              <FeedbackState
                className="mt-4"
                tone="success"
                title={t("employeeAccess.generatedPasswordTitle")}
                description={t("employeeAccess.generatedPasswordDescription", { password: generatedPassword })}
              />
            ) : null}
            {reset.error ? <FeedbackState className="mt-4" tone="error" title={t("employeeAccess.resetError")} description={reset.error.message} /> : null}
            {active.error ? <FeedbackState className="mt-4" tone="error" title={t("employeeAccess.statusError")} description={active.error.message} /> : null}
          </DetailCard>
        </div>
      ) : null}
    </PagePermissionGuard>
  );
}

function roleLabel(role: string, t: (key: string) => string) {
  const key = `employeeAccess.role.${role}`;
  const translated = t(key);
  return translated === key ? role.replaceAll("_", " ") : translated;
}

function loginReadinessLabel(reason: string, t: (key: string) => string) {
  const key = `employeeAccess.loginReadiness.${reason}`;
  const translated = t(key);
  return translated === key ? t("employeeAccess.loginReadiness.UNKNOWN") : translated;
}
