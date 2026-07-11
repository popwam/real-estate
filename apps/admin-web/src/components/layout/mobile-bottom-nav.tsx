"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useAllowedNavigation } from "@/hooks/use-navigation";
import { useI18n } from "@/i18n";
import {
  getMobileBottomNavItems,
  groupNavItems,
} from "@/lib/navigation-engine";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navItems = useAllowedNavigation();
  const { primaryItems, overflowItems, moreItem } = getMobileBottomNavItems(navItems, 5);
  const MoreIcon = moreItem.icon;

  const query = searchTerm.trim().toLowerCase();
  const filteredOverflow = query
    ? overflowItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.group.toLowerCase().includes(query),
      )
    : overflowItems;
  const groupedOverflow = groupNavItems(filteredOverflow);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [moreOpen]);

  function closeMore() {
    setMoreOpen(false);
    setSearchTerm("");
  }

  return (
    <div className="lg:hidden">
      {moreOpen && overflowItems.length ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[39] cursor-default bg-[var(--color-overlay)]"
            onClick={closeMore}
            aria-label={t("navigation.closeMore")}
          />
          <section
            className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-40 flex max-h-[min(78vh,calc(100vh-var(--bottom-nav-height)-env(safe-area-inset-bottom)-1rem))] flex-col rounded-t-[var(--radius-xl)] border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xl)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">{t("navigation.workspaceShort")}</p>
                <h2 id="mobile-more-title" className="text-lg font-semibold text-[var(--color-foreground)]">{t("navigation.moreTools")}</h2>
              </div>
              <button
                type="button"
                onClick={closeMore}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
                aria-label={t("navigation.closeMore")}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <label className="relative block">
                <span className="sr-only">{t("navigation.search")}</span>
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t("navigation.searchPlaceholder")}
                  className="ui-input ps-10"
                  autoFocus
                />
              </label>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              {Object.keys(groupedOverflow).length ? (
                Object.entries(groupedOverflow).map(([group, items]) => (
                  <section key={group} className="mb-6 last:mb-0">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">{group}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={closeMore}
                            className={cn(
                              "flex min-h-16 min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-foreground)]",
                              active && "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
                            )}
                            aria-current={active ? "page" : undefined}
                          >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="ui-card px-4 py-8 text-center text-sm text-[var(--color-muted)]">{t("navigation.noMatchingPages")}</div>
              )}
            </div>
          </section>
        </>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--z-fixed)] border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[0_-8px_24px_rgb(15_23_42_/_0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={t("navigation.mobileAdmin")}
      >
        <div className="grid h-[var(--bottom-nav-height)] grid-cols-5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeMore}
                className={navClass(active)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.8} aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={navClass(moreOpen)}
            aria-label={t("navigation.moreAdmin")}
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

function navClass(active: boolean) {
  return cn(
    "mx-1 my-1 flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 text-[11px] font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
    active && "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  );
}
