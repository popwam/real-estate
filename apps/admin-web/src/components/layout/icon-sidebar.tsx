"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getNavItemsForUser,
  getPrimaryDesktopNavItems,
  getOverflowNavItems,
  recordNavUsage,
} from "@/lib/navigation-engine";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { IconSidebarMoreMenu } from "./icon-sidebar-more-menu";

/**
 * Icon-Only Sidebar (72px)
 *
 * Features:
 * - Collapsed by default (72px width)
 * - Icon-first navigation
 * - Tooltips for accessibility
 * - More menu for overflow items
 * - Active route highlighting
 * - Role-aware navigation
 * - Usage-aware ordering
 */
export function IconSidebar() {
  const pathname = usePathname();
  const { data } = useCurrentUser();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navItems = getNavItemsForUser(data?.user.role, data?.organization?.type);
  const primaryItems = getPrimaryDesktopNavItems(navItems, 12);
  const overflowItems = getOverflowNavItems(navItems, primaryItems);

  const handleNavClick = useCallback(
    (itemId: string) => {
      recordNavUsage(itemId);
    },
    []
  );

  const hasOverflow = overflowItems.length > 0;

  return (
    <aside className="sticky top-0 hidden h-screen w-[var(--sidebar-collapsed-width)] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background)] lg:flex lg:flex-col">
      {/* Logo/Branding */}
      <div className="flex h-[var(--topbar-height)] items-center justify-center border-b border-[var(--color-border)]">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-sm font-bold text-[var(--color-primary-foreground)]"
          title="POPWAM Admin Home"
        >
          P
        </Link>
      </div>

      {/* Primary Navigation Icons */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "group relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
                "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
                active && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              )}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {/* Tooltip on hover */}
              <span className="pointer-events-none absolute left-full z-[var(--z-tooltip)] ml-2 hidden whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm font-medium text-[var(--color-foreground)] shadow-md group-hover:block group-focus-visible:block">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* More Menu Button */}
      {hasOverflow && (
        <div className="border-t border-[var(--color-border)] p-2">
          <IconSidebarMoreMenu
            items={overflowItems}
            isOpen={moreMenuOpen}
            onOpenChange={setMoreMenuOpen}
            onItemClick={handleNavClick}
            activePathname={pathname}
          />
        </div>
      )}
    </aside>
  );
}
