"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getMobileBottomNavItems,
  getNavItemsForUser,
  groupNavItems,
  recordNavUsage,
} from "@/lib/navigation-engine";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data } = useCurrentUser();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = getNavItemsForUser(data?.user.role, data?.organization?.type);
  const { primaryItems, overflowItems, moreItem } = getMobileBottomNavItems(navItems, 5);
  const groupedOverflow = groupNavItems(overflowItems);
  const MoreIcon = moreItem.icon;

  useEffect(() => {
    if (!moreOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [moreOpen]);

  const handleNavClick = useCallback((itemId: string) => {
    recordNavUsage(itemId);
    setMoreOpen(false);
  }, []);

  return (
    <div ref={menuRef} className="lg:hidden">
      {moreOpen && overflowItems.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[39] bg-black/20"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <div
            className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-40 max-h-[min(75vh,calc(100vh-var(--bottom-nav-height)-env(safe-area-inset-bottom)-1rem))] overflow-y-auto rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl"
            role="menu"
            aria-label="More admin navigation"
          >
            {/* Header */}
            <div className="sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                More Navigation
              </h2>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              {Object.entries(groupedOverflow).map(([group, items]) => (
                <section key={group} className="mb-6 last:mb-0">
                  <p className="mb-3 text-xs font-semibold uppercase text-[var(--color-muted)]">
                    {group}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => handleNavClick(item.id)}
                          className={cn(
                            "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-3 py-2 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
                            "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]",
                            active &&
                              "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          )}
                          role="menuitem"
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                          <span className="w-full max-w-full truncate text-xs font-medium">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--z-fixed)] border-t border-[var(--color-border)] bg-[var(--color-background)] shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile admin navigation"
      >
        <div className="grid h-[var(--bottom-nav-height)] grid-cols-5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "mx-1 my-1 flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
                  "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
                  active && "bg-[var(--color-surface)] text-[var(--color-primary)]"
                )}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "mx-1 my-1 flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
              "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
              moreOpen && "bg-[var(--color-surface)] text-[var(--color-primary)]"
            )}
            aria-label="More admin navigation"
            aria-expanded={moreOpen}
          >
            <MoreIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="max-w-full truncate">{moreItem.label}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
