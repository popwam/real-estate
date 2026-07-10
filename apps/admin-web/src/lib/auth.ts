"use client";

import type { AuthSession, UserRole } from "@/types/auth";
import { getNavItemsForUser } from "@/lib/navigation-engine";

const ACCESS_TOKEN_KEY = "popwam.admin.accessToken";
const REFRESH_TOKEN_KEY = "popwam.admin.refreshToken";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(session: Pick<AuthSession, "accessToken" | "refreshToken">) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRoleHome(role?: UserRole, organizationType?: string | null, permissions: string[] = []) {
  const firstAllowed = getNavItemsForUser(role, organizationType, permissions)[0]?.href;
  if (firstAllowed) return firstAllowed;

  if (!role && organizationType === "PLATFORM") return "/platform/dashboard";
  if (!role && organizationType === "DEVELOPER") return "/developer/dashboard";
  if (!role && (organizationType === "BROKERAGE" || organizationType === "INDIVIDUAL_BROKER")) {
    return "/brokerage/dashboard";
  }

  if (role?.startsWith("platform_")) return "/platform/dashboard";
  if (
    role?.startsWith("developer_") ||
    ["company_admin", "hr_manager", "hr_employee", "sales_manager", "sales_agent", "finance_user", "employee_self_service"].includes(role ?? "")
  ) return "/developer/dashboard";
  if (role === "brokerage_owner" || role === "brokerage_admin" || role === "broker" || role === "individual_broker") {
    return "/brokerage/dashboard";
  }

  return "/login";
}
