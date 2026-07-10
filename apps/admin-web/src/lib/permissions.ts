import type { MeResponse, UserRole } from "@/types/auth";

export const PLATFORM_ROLES: UserRole[] = [
  "platform_owner",
  "platform_admin",
  "platform_support",
  "platform_auditor",
];

export const DEVELOPER_ROLES: UserRole[] = [
  "developer_owner",
  "developer_admin",
  "developer_sales_manager",
  "developer_sales_agent",
  "company_admin",
  "hr_manager",
  "hr_employee",
  "sales_manager",
  "sales_agent",
  "finance_user",
  "employee_self_service",
];

export const BROKERAGE_ROLES: UserRole[] = [
  "brokerage_owner",
  "brokerage_admin",
  "broker",
  "individual_broker",
];

export function hasPermission(session: Pick<MeResponse, "permissions"> | undefined, permission: string) {
  return Boolean(session?.permissions.includes(permission));
}

export function hasAnyPermission(session: Pick<MeResponse, "permissions"> | undefined, permissions: string[]) {
  return permissions.some((permission) => hasPermission(session, permission));
}

export function isPlatformRole(role?: UserRole) {
  return Boolean(role && PLATFORM_ROLES.includes(role));
}

export function isDeveloperRole(role?: UserRole) {
  return Boolean(role && DEVELOPER_ROLES.includes(role));
}

export function isBrokerageRole(role?: UserRole) {
  return Boolean(role && BROKERAGE_ROLES.includes(role));
}
