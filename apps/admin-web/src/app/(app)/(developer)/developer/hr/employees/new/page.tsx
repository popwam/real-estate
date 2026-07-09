"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FeedbackState } from "@/components/feedback-state";
import { EmployeeForm, type EmployeeFormValues } from "@/components/hr/employee-form";
import { PageHeader } from "@/components/layout/page-header";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { useI18n } from "@/i18n";
import { createHrEmployeeApi } from "@/lib/hr-employees-api";

export default function NewHrEmployeePage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (values: EmployeeFormValues) => createHrEmployeeApi(values),
    onSuccess: async (employee) => {
      await queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      router.replace(`/developer/hr/employees/${employee.id}`);
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
        {create.error ? (
          <FeedbackState tone="error" title={t("employeeAccess.createError")} description={create.error.message} />
        ) : null}
      </div>
    </PagePermissionGuard>
  );
}
