"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSidebarMoreMenu } from "@/components/layout/icon-sidebar-more-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getNavItemsForUser,
  getOverflowNavItems,
  getPrimaryDesktopNavItems,
} from "@/lib/navigation-engine";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function IconSidebar() {
  const { t } = useI18n();

  const pathname = usePathname();
  const { data } = useCurrentUser();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navItems = getNavItemsForUser(data?.user.role, data?.organization?.type, data?.permissions);
  const primaryItems = getPrimaryDesktopNavItems(navItems, 8);
  const overflowItems = getOverflowNavItems(navItems, primaryItems);
  const homeHref = primaryItems[0]?.href ?? "/login";

  return (
    <aside className="sticky top-0 z-[var(--z-sticky)] hidden h-screen w-[var(--sidebar-collapsed-width)] shrink-0 overflow-x-hidden border-e border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)] lg:flex lg:flex-col">
      <div className="flex h-[var(--topbar-height)] items-center justify-center border-b border-[var(--color-border)]">
        <Link
          href={homeHref}
          className="relative flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-sm font-black tracking-tight text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5"
          title={t("adminSweep.popwam.workspace.home.eb4c5bdf")}
          aria-label={t("adminSweep.popwam.workspace.home.eb4c5bdf")}
        >
          P
          <span className="absolute -end-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-accent)]" />
        </Link>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-3 py-4"
        aria-label={t("adminSweep.primary.admin.navigation.4379cbfa")}
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors",
                "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
                active &&
                  "bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]",
              )}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-[var(--color-accent)]" />
              ) : null}
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.8} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>

      {overflowItems.length ? (
        <div className="flex justify-center border-t border-[var(--color-border)] px-3 py-4">
          <IconSidebarMoreMenu
            items={overflowItems}
            isOpen={moreMenuOpen}
            onOpenChange={setMoreMenuOpen}
            activePathname={pathname}
          />
        </div>
      ) : null}
    </aside>
  );
}
