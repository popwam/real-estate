"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LogIn, LogOut, Power, Trash2, UserRound, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_QUERY_KEY } from "@/components/providers/auth-session-provider";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAllowedNavigation } from "@/hooks/use-navigation";
import { useI18n } from "@/i18n";
import {
  clearAllAccounts,
  clearTokens,
  getRoleHome,
  getStoredAccounts,
  onAuthChange,
  removeStoredAccount,
  switchStoredAccount,
  type StoredAccount,
} from "@/lib/auth";
import { getActiveNavItem } from "@/lib/navigation-engine";
import { cn } from "@/lib/utils";

export function Topbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { t } = useI18n();
  const { data } = useCurrentUser();
  const navItems = useAllowedNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const name = [data?.user.firstName, data?.user.lastName].filter(Boolean).join(" ");
  const displayName = name || data?.user.email || t("auth.userFallback");
  const activeItem = getActiveNavItem(navItems, pathname);
  const initials = initialsFor(displayName);

  useEffect(() => {
    const syncAccounts = () => setAccounts(getStoredAccounts());
    syncAccounts();
    return onAuthChange(syncAccounts);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function refreshAuthState() {
    setMenuOpen(false);
  }

  function refreshAccess() {
    void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY, exact: true });
    setMenuOpen(false);
  }

  function switchAccount(account: StoredAccount) {
    if (!switchStoredAccount(account.userId)) return;
    refreshAuthState();
    router.replace(getRoleHome(account.role));
  }

  function logoutCurrent() {
    clearTokens();
    refreshAuthState();
    router.replace("/login");
  }

  function logoutAll() {
    clearAllAccounts();
    refreshAuthState();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-[var(--topbar-height)] items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_92%,transparent)] px-4 backdrop-blur-xl lg:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
          <span className="truncate">{activeItem?.group ?? t("navigation.workspace")}</span>
          <span aria-hidden="true">/</span>
          <span className="truncate text-[var(--color-accent)]">{activeItem?.label ?? t("navigation.overview")}</span>
        </div>
        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-foreground)]">
          {data?.organization?.name ?? "POPWAM"}
        </p>
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 ps-1.5 pe-3 hover:bg-[var(--color-surface-muted)]"
          aria-label={t("account.switch")}
          title={t("account.switch")}
          aria-expanded={menuOpen}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent)]">
            {initials}
          </span>
          <span className="hidden min-w-0 max-w-44 text-start md:block">
            <span className="block truncate text-xs font-semibold text-[var(--color-foreground)]">{displayName}</span>
            <span className="block truncate text-[11px] text-[var(--color-muted)]">{roleLabel(data?.user.role, t)}</span>
          </span>
        </button>

        <Button
          className="ui-button-secondary h-10 px-3"
          onClick={logoutCurrent}
          aria-label={t("auth.signOut")}
          title={t("auth.signOut")}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">{t("auth.signOut")}</span>
        </Button>

        {menuOpen ? (
          <section
            className="absolute end-0 top-[calc(100%+0.5rem)] z-[var(--z-popover)] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xl)]"
            role="dialog"
            aria-label={t("account.switch")}
          >
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <p className="text-xs font-bold uppercase text-[var(--color-accent)]">{t("account.current")}</p>
              <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{displayName}</p>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {accounts.map((account) => {
                const active = data?.user.id === account.userId;
                return (
                  <div key={account.userId} className={cn("grid grid-cols-[1fr_auto] items-center gap-2 rounded-[var(--radius-md)] p-2", active && "bg-[var(--color-accent-soft)]")}>
                    <button
                      type="button"
                      onClick={() => switchAccount(account)}
                      className="flex min-w-0 items-center gap-3 text-start"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-xs font-bold text-[var(--color-foreground)]">
                        {initialsFor(account.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--color-foreground)]">{account.name}</span>
                        <span className="block truncate text-xs text-[var(--color-muted)]">{account.maskedIdentifier}</span>
                        <span className="block truncate text-xs text-[var(--color-muted)]">{account.organizationName}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeStoredAccount(account.userId);
                        if (active) router.replace("/login");
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-danger)]"
                      aria-label={t("account.remove")}
                      title={t("account.remove")}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-2 border-t border-[var(--color-border)] p-3">
              <MenuAction icon={<LogIn className="h-4 w-4" aria-hidden="true" />} label={t("account.add")} onClick={() => router.push("/login")} />
              <MenuAction icon={<UserRound className="h-4 w-4" aria-hidden="true" />} label={t("account.refreshAccess")} onClick={refreshAccess} />
              <MenuAction icon={<UserRound className="h-4 w-4" aria-hidden="true" />} label={t("account.logoutCurrent")} onClick={logoutCurrent} />
              <MenuAction icon={<Users className="h-4 w-4" aria-hidden="true" />} label={t("account.logoutAll")} onClick={logoutAll} />
              <MenuAction icon={<Power className="h-4 w-4" aria-hidden="true" />} label={t("auth.signOut")} onClick={logoutCurrent} />
            </div>
          </section>
        ) : null}
      </div>
    </header>
  );
}

function MenuAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
    >
      {icon}
      {label}
    </button>
  );
}

function initialsFor(value: string) {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function roleLabel(role: string | undefined, t: (key: string) => string) {
  return role ? t(`roles.${role}`) : t("auth.workspaceMember");
}
