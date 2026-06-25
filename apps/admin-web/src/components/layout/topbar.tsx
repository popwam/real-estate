"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { DisplayPreferences } from "@/components/layout/display-preferences";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { clearTokens } from "@/lib/auth";
import { getActiveNavItem, getNavItemsForUser } from "@/lib/navigation-engine";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const { data } = useCurrentUser();
  const name = [data?.user.firstName, data?.user.lastName].filter(Boolean).join(" ");
  const displayName = name || data?.user.email || t("auth.userFallback");
  const navItems = getNavItemsForUser(data?.user.role, data?.organization?.type);
  const activeItem = getActiveNavItem(navItems, pathname);
  const initials = initialsFor(displayName);

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-[var(--topbar-height)] items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_92%,transparent)] px-4 backdrop-blur-xl lg:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
          <span className="truncate">{activeItem?.group ?? "Workspace"}</span>
          <span aria-hidden="true">/</span>
          <span className="truncate text-[var(--color-accent)]">{activeItem?.label ?? "Overview"}</span>
        </div>
        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-foreground)]">
          {data?.organization?.name ?? "POPWAM"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden lg:block">
          <DisplayPreferences compact />
        </div>

        <div className="hidden min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 ps-1.5 pe-3 md:flex">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent)]">
            {initials}
          </span>
          <div className="min-w-0 max-w-44">
            <p className="truncate text-xs font-semibold text-[var(--color-foreground)]">{displayName}</p>
            <p className="truncate text-[11px] text-[var(--color-muted)]">{humanizeRole(data?.user.role)}</p>
          </div>
        </div>

        <Button
          className="ui-button-secondary h-10 px-3"
          onClick={() => {
            clearTokens();
            router.replace("/login");
          }}
          aria-label={t("auth.signOut")}
          title={t("auth.signOut")}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">{t("auth.signOut")}</span>
        </Button>
      </div>
    </header>
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

function humanizeRole(role?: string) {
  return role ? role.replaceAll("_", " ") : "Workspace member";
}
