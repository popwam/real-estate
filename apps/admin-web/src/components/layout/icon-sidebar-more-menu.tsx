"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, X } from "lucide-react";
import { groupNavItems } from "@/lib/navigation-engine";
import type { NavItem } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

interface IconSidebarMoreMenuProps {
  items: NavItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onItemClick: (itemId: string) => void;
  activePathname: string;
}

/**
 * More Menu for Icon Sidebar
 *
 * Shows overflow navigation items in a large full-height modal/sheet
 * Accessible keyboard navigation with Escape to close
 * Grouped by section with icon + label display
 */
export function IconSidebarMoreMenu({
  items,
  isOpen,
  onOpenChange,
  onItemClick,
  activePathname,
}: IconSidebarMoreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const grouped = groupNavItems(items);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const handleItemClick = useCallback(
    (itemId: string) => {
      onItemClick(itemId);
      onOpenChange(false);
      setSearchTerm("");
    },
    [onItemClick, onOpenChange]
  );

  // Filter items by search term
  const filteredGroups = Object.entries(grouped).reduce(
    (acc, [group, groupItems]) => {
      const filtered = groupItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[group] = filtered;
      }
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  return (
    <div className="relative" ref={menuRef}>
      {/* More Button */}
      <button
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "group relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
          "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
          isOpen && "bg-[var(--color-surface)] text-[var(--color-foreground)]"
        )}
        title="More menu"
        aria-label="More navigation items"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        {/* Tooltip on hover */}
        <span className="pointer-events-none absolute left-full z-[var(--z-tooltip)] ml-2 hidden whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm font-medium text-[var(--color-foreground)] shadow-md group-hover:block group-focus-visible:block">
          More
        </span>
      </button>

      {/* Full-Height Modal Sheet */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[49] bg-black/30" aria-hidden="true" />

          {/* Modal */}
          <div
            ref={modalRef}
            className="fixed inset-y-0 left-[var(--sidebar-collapsed-width)] right-0 z-50 flex min-h-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl"
            role="menu"
            aria-label="Additional navigation"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                More Navigation
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                )}
                aria-label="Close more menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Search Input */}
            <div className="border-b border-[var(--color-border)] px-6 py-3">
              <input
                type="text"
                placeholder="Search navigation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)]",
                  "px-3 py-2 text-sm placeholder-[var(--color-muted)]",
                  "text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                )}
                aria-label="Search navigation items"
              />
            </div>

            {/* Grouped Navigation Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {Object.entries(filteredGroups).length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                  No items found matching &quot;{searchTerm}&quot;
                </p>
              ) : (
                Object.entries(filteredGroups).map(([group, groupItems]) => (
                  <section key={group} className="mb-6 last:mb-0">
                    {/* Group Header */}
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      {group}
                    </h3>

                    {/* Group Items */}
                    <div className="space-y-2">
                      {groupItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                          activePathname === item.href ||
                          activePathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => handleItemClick(item.id)}
                            className={cn(
                              "group/item flex min-w-0 items-center gap-3 rounded-md px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
                              "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]",
                              active &&
                                "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                            )}
                            role="menuitem"
                          >
                            <Icon
                              className="h-5 w-5 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 truncate font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            {/* Footer - Close hint */}
            <div className="border-t border-[var(--color-border)] px-6 py-3 text-center text-xs text-[var(--color-muted)]">
              Press <kbd className="rounded bg-[var(--color-surface)] px-2 py-1">Esc</kbd> to close
            </div>
          </div>
        </>
      )}
    </div>
  );
}
