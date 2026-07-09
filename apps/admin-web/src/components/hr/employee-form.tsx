"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { isPlatformRole } from "@/lib/permissions";
import type { HrEmployee, HrEmployeeInput } from "@/lib/hr-employees-api";
import { employeePermissionKeys } from "@/lib/hr-employees-api";
import {
  EMPLOYEE_PERMISSION_GROUPS,
  EMPLOYEE_ROLE_OPTIONS,
  PERMISSION_LABEL_KEYS,
} from "@/components/hr/employee-permission-data";

export type EmployeeFormValues = HrEmployeeInput & {
  permissions: string[];
};

export function EmployeeForm({
  employee,
  mode,
  isSaving,
  onSubmit,
}: {
  employee?: HrEmployee | null;
  mode: "create" | "edit";
  isSaving?: boolean;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}) {
  const { t } = useI18n();
  const { data } = useCurrentUser();
  const isPlatform = isPlatformRole(data?.user.role);
  const existingPermissions = useMemo(() => employeePermissionKeys(employee), [employee]);
  const [values, setValues] = useState<EmployeeFormValues>(() => ({
    firstName: employee?.user?.firstName ?? firstNameFromName(employee?.name),
    lastName: employee?.user?.lastName ?? lastNameFromName(employee?.name),
    phone: employee?.phone ?? employee?.user?.phone ?? "",
    email: employee?.email ?? employee?.user?.email ?? "",
    jobTitle: employee?.roleTitle ?? "",
    departmentId: employee?.departmentId ?? "",
    role: initialRole(employee?.user?.role?.name),
    temporaryPassword: "",
    status: employee?.status ?? "ACTIVE",
    permissions: existingPermissions,
  }));

  const visibleGroups = EMPLOYEE_PERMISSION_GROUPS.filter(
    (group) => !("platformOnly" in group) || !group.platformOnly || isPlatform,
  );

  function update<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function togglePermission(permission: string) {
    setValues((current) => {
      const exists = current.permissions.includes(permission);
      return {
        ...current,
        permissions: exists
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission],
      };
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      ...values,
      name: [values.firstName, values.lastName].filter(Boolean).join(" "),
      roleTitle: values.jobTitle,
      temporaryPassword: values.temporaryPassword || undefined,
      departmentId: values.departmentId || undefined,
    });
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <DetailCard title={t("employeeAccess.accountDetails")}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label={t("employeeAccess.firstName")} id="firstName">
            <Input id="firstName" value={values.firstName ?? ""} onChange={(event) => update("firstName", event.target.value)} />
          </Field>
          <Field label={t("employeeAccess.lastName")} id="lastName">
            <Input id="lastName" value={values.lastName ?? ""} onChange={(event) => update("lastName", event.target.value)} />
          </Field>
          <Field label={t("employeeAccess.phone")} id="phone">
            <Input id="phone" value={values.phone ?? ""} onChange={(event) => update("phone", event.target.value)} />
          </Field>
          <Field label={t("employeeAccess.email")} id="email">
            <Input id="email" type="email" value={values.email ?? ""} onChange={(event) => update("email", event.target.value)} required />
          </Field>
          <Field label={t("employeeAccess.jobTitle")} id="jobTitle">
            <Input id="jobTitle" value={values.jobTitle ?? ""} onChange={(event) => update("jobTitle", event.target.value)} />
          </Field>
          <Field label={t("employeeAccess.department")} id="departmentId">
            <Input id="departmentId" value={values.departmentId ?? ""} onChange={(event) => update("departmentId", event.target.value)} />
          </Field>
          <Field label={t("employeeAccess.role")} id="role">
            <select id="role" className="ui-input" value={values.role} onChange={(event) => update("role", event.target.value)}>
              {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{t(`employeeAccess.role.${role}`)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("employeeAccess.status")} id="status">
            <select id="status" className="ui-input" value={values.status} onChange={(event) => update("status", event.target.value as "ACTIVE" | "INACTIVE")}>
              <option value="ACTIVE">{t("employeeAccess.active")}</option>
              <option value="INACTIVE">{t("employeeAccess.inactive")}</option>
            </select>
          </Field>
          <Field label={mode === "create" ? t("employeeAccess.temporaryPassword") : t("employeeAccess.newPasswordOptional")} id="temporaryPassword">
            <Input
              id="temporaryPassword"
              type="password"
              autoComplete="new-password"
              value={values.temporaryPassword ?? ""}
              onChange={(event) => update("temporaryPassword", event.target.value)}
              required={mode === "create"}
            />
          </Field>
        </div>
      </DetailCard>

      <DetailCard title={t("employeeAccess.permissions")}>
        <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-foreground)]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
          <p>{t("employeeAccess.doNotShareWarning")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleGroups.map((group) => (
            <section key={group.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">{t(group.labelKey)}</h3>
              <div className="grid gap-2">
                {group.permissions.map((permission) => (
                  <label key={permission} className="flex items-start gap-3 text-sm text-[var(--color-foreground)]">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={values.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                    />
                    <span>
                      <span className="block font-medium">{t(PERMISSION_LABEL_KEYS[permission] ?? permission)}</span>
                      <span className="block text-xs text-[var(--color-muted)]">{permission}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DetailCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving}>
          {mode === "create" ? <KeyRound className="h-4 w-4" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {isSaving ? t("common.saving") : mode === "create" ? t("employeeAccess.createEmployee") : t("employeeAccess.saveEmployee")}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function firstNameFromName(name?: string | null) {
  return name?.split(" ")[0] ?? "";
}

function lastNameFromName(name?: string | null) {
  return name?.split(" ").slice(1).join(" ") ?? "";
}

function initialRole(role?: string) {
  return EMPLOYEE_ROLE_OPTIONS.some((option) => option === role)
    ? role
    : "employee_self_service";
}
