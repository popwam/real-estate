"use client";

import type { AuthSession, MeResponse, UserRole } from "@/types/auth";
import { getNavItemsForUser } from "@/lib/navigation-engine";

const ACCESS_TOKEN_KEY = "popwam.admin.accessToken";
const REFRESH_TOKEN_KEY = "popwam.admin.refreshToken";
const ACCOUNTS_KEY = "popwam.admin.accounts";
const ACTIVE_ACCOUNT_KEY = "popwam.admin.activeAccountId";
const AUTH_EVENT = "popwam-auth-change";

export type AuthChange = {
  type: "login" | "refresh" | "account" | "logout";
  session?: AuthSession;
};

export type StoredAccount = {
  userId: string;
  name: string;
  maskedIdentifier: string;
  role: UserRole;
  organizationName: string;
  lastUsed: string;
  persisted: boolean;
  accessToken: string;
  refreshToken: string;
};

function storage(kind: "local" | "session") {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function readToken(key: string) {
  return storage("session")?.getItem(key) ?? storage("local")?.getItem(key) ?? null;
}

export function getAccessToken() {
  return readToken(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return readToken(REFRESH_TOKEN_KEY);
}

export function storeTokens(
  session: Pick<AuthSession, "accessToken" | "refreshToken"> & Partial<AuthSession>,
  options: { persist?: boolean; reason?: "login" | "refresh" } = {},
) {
  if (typeof window === "undefined") return;
  const persist = options.persist ?? true;
  const target = persist ? storage("local") : storage("session");
  const other = persist ? storage("session") : storage("local");
  if (!target || !other) return;

  target.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  target.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);

  if (session.user) {
    const account = accountFromSession(session as AuthSession, persist);
    target.setItem(ACTIVE_ACCOUNT_KEY, account.userId);
    other.removeItem(ACTIVE_ACCOUNT_KEY);
    upsertAccount(account, persist);
  }

  announceAuthChange({
    type: options.reason ?? "login",
    session: session.user ? (session as AuthSession) : undefined,
  });
}

export function clearTokens() {
  const activeId = getActiveAccountId();
  storage("local")?.removeItem(ACCESS_TOKEN_KEY);
  storage("local")?.removeItem(REFRESH_TOKEN_KEY);
  storage("session")?.removeItem(ACCESS_TOKEN_KEY);
  storage("session")?.removeItem(REFRESH_TOKEN_KEY);
  storage("local")?.removeItem(ACTIVE_ACCOUNT_KEY);
  storage("session")?.removeItem(ACTIVE_ACCOUNT_KEY);
  if (activeId) removeStoredAccount(activeId, false);
  announceAuthChange({ type: "logout" });
}

export function clearAllAccounts() {
  storage("local")?.removeItem(ACCESS_TOKEN_KEY);
  storage("local")?.removeItem(REFRESH_TOKEN_KEY);
  storage("session")?.removeItem(ACCESS_TOKEN_KEY);
  storage("session")?.removeItem(REFRESH_TOKEN_KEY);
  storage("local")?.removeItem(ACTIVE_ACCOUNT_KEY);
  storage("session")?.removeItem(ACTIVE_ACCOUNT_KEY);
  storage("local")?.removeItem(ACCOUNTS_KEY);
  storage("session")?.removeItem(ACCOUNTS_KEY);
  announceAuthChange({ type: "logout" });
}

export function getStoredAccounts() {
  const accounts = [
    ...readAccounts("local").map((account) => ({ ...account, persisted: true })),
    ...readAccounts("session").map((account) => ({ ...account, persisted: false })),
  ];
  const byId = new Map<string, StoredAccount>();
  for (const account of accounts) byId.set(account.userId, account);
  return [...byId.values()].sort((a, b) => Date.parse(b.lastUsed) - Date.parse(a.lastUsed));
}

export function getActiveAccountId() {
  return readToken(ACTIVE_ACCOUNT_KEY);
}

export function isActiveAccountPersisted() {
  const activeId = getActiveAccountId();
  return Boolean(activeId && getStoredAccounts().find((item) => item.userId === activeId)?.persisted);
}

export function switchStoredAccount(userId: string) {
  const account = getStoredAccounts().find((item) => item.userId === userId);
  if (!account) return false;
  const target = account.persisted ? storage("local") : storage("session");
  const other = account.persisted ? storage("session") : storage("local");
  if (!target || !other) return false;

  target.setItem(ACCESS_TOKEN_KEY, account.accessToken);
  target.setItem(REFRESH_TOKEN_KEY, account.refreshToken);
  target.setItem(ACTIVE_ACCOUNT_KEY, account.userId);
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
  other.removeItem(ACTIVE_ACCOUNT_KEY);
  upsertAccount({ ...account, lastUsed: new Date().toISOString() }, account.persisted);
  announceAuthChange({ type: "account" });
  return true;
}

export function removeStoredAccount(userId: string, announce = true) {
  for (const kind of ["local", "session"] as const) {
    const next = readAccounts(kind).filter((account) => account.userId !== userId);
    writeAccounts(kind, next);
    if (storage(kind)?.getItem(ACTIVE_ACCOUNT_KEY) === userId) {
      storage(kind)?.removeItem(ACTIVE_ACCOUNT_KEY);
      storage(kind)?.removeItem(ACCESS_TOKEN_KEY);
      storage(kind)?.removeItem(REFRESH_TOKEN_KEY);
    }
  }
  if (announce) announceAuthChange({ type: "account" });
}

export function saveActiveAccountFromMe(me: MeResponse) {
  const activeId = getActiveAccountId();
  if (!activeId) return;
  const account = getStoredAccounts().find((item) => item.userId === activeId);
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!account || !accessToken || !refreshToken) return;
  upsertAccount(
    {
      ...account,
      ...metadataFromMe(me),
      accessToken,
      refreshToken,
      lastUsed: new Date().toISOString(),
    },
    account.persisted,
  );
}

export function onAuthChange(listener: (change: AuthChange) => void) {
  if (typeof window === "undefined") return () => undefined;
  const authListener = (event: Event) =>
    listener((event as CustomEvent<AuthChange>).detail ?? { type: "account" });
  const storageListener = () => listener({ type: "account" });
  window.addEventListener(AUTH_EVENT, authListener);
  window.addEventListener("storage", storageListener);
  return () => {
    window.removeEventListener(AUTH_EVENT, authListener);
    window.removeEventListener("storage", storageListener);
  };
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

function readAccounts(kind: "local" | "session"): StoredAccount[] {
  try {
    const raw = storage(kind)?.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isStoredAccount) : [];
  } catch {
    return [];
  }
}

function writeAccounts(kind: "local" | "session", accounts: StoredAccount[]) {
  const target = storage(kind);
  if (!target) return;
  if (accounts.length) target.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  else target.removeItem(ACCOUNTS_KEY);
}

function upsertAccount(account: StoredAccount, persist: boolean) {
  const kind = persist ? "local" : "session";
  const other = persist ? "session" : "local";
  writeAccounts(
    kind,
    [account, ...readAccounts(kind).filter((item) => item.userId !== account.userId)].slice(0, 8),
  );
  writeAccounts(other, readAccounts(other).filter((item) => item.userId !== account.userId));
}

function accountFromSession(session: AuthSession, persisted: boolean): StoredAccount {
  return {
    ...metadataFromMe(session),
    persisted,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    lastUsed: new Date().toISOString(),
  };
}

function metadataFromMe(me: MeResponse | AuthSession) {
  const displayName = [me.user.firstName, me.user.lastName].filter(Boolean).join(" ") || me.user.email;
  return {
    userId: me.user.id,
    name: displayName,
    maskedIdentifier: maskIdentifier(me.user.email || me.user.phone || me.user.id),
    role: me.user.role,
    organizationName: me.organization?.name ?? "POPWAM",
  };
}

function maskIdentifier(value: string) {
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : "***";
}

function isStoredAccount(value: unknown): value is StoredAccount {
  const account = value as Partial<StoredAccount>;
  return Boolean(
    account &&
      typeof account.userId === "string" &&
      typeof account.accessToken === "string" &&
      typeof account.refreshToken === "string",
  );
}

function announceAuthChange(change: AuthChange) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<AuthChange>(AUTH_EVENT, { detail: change }));
  }
}
