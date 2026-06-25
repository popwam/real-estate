"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Search, X } from "lucide-react";
import type { NavItem } from "@/components/layout/nav";
import { groupNavItems } from "@/lib/navigation-engine";
import { cn } from "@/lib/utils";

type IconSidebarMoreMenuProps = {
  items: NavItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activePathname: string;
};

export function IconSidebarMoreMenu({
  items,
  isOpen,
  onOpenChange,
  activePathname,
}: IconSidebarMoreMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = query
      ? items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.group.toLowerCase().includes(query),
        )
      : items;
    return groupNavItems(filtered);
  }, [items, searchTerm]);

  useEffect(() => {
    if (!isOpen) return;

    searchRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onOpenChange]);

  function closeMenu() {
    setSearchTerm("");
    onOpenChange(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
          isOpen && "bg-[var(--color-surface-muted)] text-[var(--color-foreground)]",
        )}
        title="More navigation"
        aria-label="Open more navigation"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        <span className="pointer-events-none absolute start-full z-[var(--z-tooltip)] ms-3 hidden whitespace-nowrap rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--color-foreground)] shadow-[var(--shadow-md)] group-hover:block group-focus-visible:block">
          More
        </span>
      </button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-[49] bg-[var(--color-overlay)]" aria-hidden="true" />
          <div
            ref={dialogRef}
            className="fixed inset-y-0 z-50 flex w-[min(28rem,calc(100vw-var(--sidebar-collapsed-width)))] min-h-0 flex-col border-e border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xl)]"
            style={{ insetInlineStart: "var(--sidebar-collapsed-width)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-more-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  Workspace navigation
                </p>
                <h2 id="admin-more-title" className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                  More tools
                </h2>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
                aria-label="Close more navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <label className="relative block">
                <span className="sr-only">Search navigation</span>
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search pages and workflows"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ui-input ps-10"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {Object.keys(filteredGroups).length ? (
                Object.entries(filteredGroups).map(([group, groupItems]) => (
                  <section key={group} className="mb-7 last:mb-0">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      {group}
                    </h3>
                    <div className="grid gap-1.5">
                      {groupItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                          activePathname === item.href ||
                          activePathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={closeMenu}
                            className={cn(
                              "flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface-muted)]",
                              active && "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
                            )}
                            aria-current={active ? "page" : undefined}
                          >
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
                              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="ui-card px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">No navigation matches</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">Try a page name or workflow.</p>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-muted)]">
              Press <kbd className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-mono">Esc</kbd> to close
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
