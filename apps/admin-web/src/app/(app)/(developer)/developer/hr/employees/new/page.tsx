"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FeedbackState } from "@/components/feedback-state";
import { EmployeeForm, type EmployeeFormValues } from "@/components/hr/employee-form";
import { PageHeader } from "@/components/layout/page-header";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { createHrEmployeeApi, type HrEmployee } from "@/lib/hr-employees-api";

export default function NewHrEmployeePage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [createdEmployee, setCreatedEmployee] = useState<HrEmployee | null>(null);
  const [oneTimePassword, setOneTimePassword] = useState("");
  const create = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      const employee = await createHrEmployeeApi(values);
      return { employee, temporaryPassword: values.temporaryPassword ?? "" };
    },
    onSuccess: async (employee) => {
      await queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      setCreatedEmployee(employee.employee);
      setOneTimePassword(employee.temporaryPassword);
    },
  });

  return (
    <PagePermissionGuard permissions={["hr.employees.create", "hr.manage", "users.manage_own_org"]}>
      <PageHeader title={t("employeeAccess.newTitle")} description={t("employeeAccess.newDescription")} />
      <div className="space-y-6">
        <FeedbackState
          tone="success"
          title={t("employeeAccess.separateAccountsTitle")}
          description={t("employeeAccess.doNotShareWarning")}
        />
        <EmployeeForm
          mode="create"
          isSaving={create.isPending}
          onSubmit={async (values) => {
            await create.mutateAsync(values);
          }}
        />
        {createdEmployee ? (
          <FeedbackState
            tone="success"
            title={t("employeeAccess.createdPasswordTitle")}
            description={t("employeeAccess.createdPasswordDescription", { password: oneTimePassword })}
            action={
              <Link href={`/developer/hr/employees/${createdEmployee.id}`}>
                <Button className="ui-button-secondary">{t("employeeAccess.viewEmployee")}</Button>
              </Link>
            }
          />
        ) : null}
        {create.error ? (
          <FeedbackState tone="error" title={t("employeeAccess.createError")} description={create.error.message} />
        ) : null}
      </div>
    </PagePermissionGuard>
  );
}
