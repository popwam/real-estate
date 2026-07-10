"use client";

import { apiRequest } from "@/lib/api";

export type HrEmployeeUser = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  hasPassword?: boolean;
  role?: {
    id: string;
    name: string;
    permissions?: Array<{ permission?: { key: string } }>;
  } | null;
};

export type HrEmployee = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  departmentId?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
  user?: HrEmployeeUser | null;
  organization?: {
    id: string;
    name: string;
    type: string;
    status: string;
  } | null;
  loginReadiness?: {
    canLogin: boolean;
    reasons: string[];
  };
};

export type HrEmployeeInput = {
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
  jobTitle?: string;
  roleTitle?: string;
  departmentId?: string;
  role?: string;
  permissions?: string[];
  temporaryPassword?: string;
  status?: "ACTIVE" | "INACTIVE";
  organizationId?: string;
  phoneCountry?: string;
};

export function listHrEmployeesApi(input?: { organizationId?: string }) {
  const params = new URLSearchParams();
  if (input?.organizationId) params.set("organizationId", input.organizationId);
  const query = params.toString();
  return apiRequest<HrEmployee[]>(`/hr/employees${query ? `?${query}` : ""}`);
}

export function getHrEmployeeApi(id: string) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}`);
}

export function createHrEmployeeApi(input: HrEmployeeInput) {
  return apiRequest<HrEmployee>("/hr/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateHrEmployeeApi(id: string, input: HrEmployeeInput) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function resetHrEmployeePasswordApi(id: string, temporaryPassword?: string) {
  return apiRequest<{ id: string; passwordReset: boolean; temporaryPassword?: string }>(
    `/hr/employees/${encodeURIComponent(id)}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify(temporaryPassword ? { temporaryPassword } : {}),
    },
  );
}

export function setHrEmployeeActiveApi(id: string, active: boolean) {
  return apiRequest<HrEmployee>(
    `/hr/employees/${encodeURIComponent(id)}/${active ? "activate" : "deactivate"}`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function updateHrEmployeeRoleApi(id: string, role: string) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateHrEmployeePermissionsApi(id: string, permissions: string[]) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}/permissions`, {
    method: "PATCH",
    body: JSON.stringify({ permissions }),
  });
}

export function employeePermissionKeys(employee?: HrEmployee | null) {
  return (
    employee?.user?.role?.permissions
      ?.map((rolePermission) => rolePermission.permission?.key)
      .filter((key): key is string => Boolean(key)) ?? []
  );
}
