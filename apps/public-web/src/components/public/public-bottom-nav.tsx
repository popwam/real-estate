"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type PublicNavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
};

const visibleItems: PublicNavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/projects", label: "Search", icon: SearchIcon },
  { href: "/developers/demo-developer", label: "Developers", icon: BuildingIcon },
];

const overflowItems: PublicNavItem[] = [
  { href: "/brokerages/demo-brokerage", label: "Brokerages", icon: BriefcaseIcon },
];

export function PublicBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={menuRef} className="md:hidden">
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[39] bg-black/20"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <div
            className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-40 max-h-[min(70vh,calc(100vh-var(--bottom-nav-height)-env(safe-area-inset-bottom)-1rem))] overflow-y-auto rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl"
            role="menu"
            aria-label="More public navigation"
          >
            {/* Header */}
            <div className="sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                More Navigation
              </h2>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              <div className="space-y-2">
                {overflowItems.map((item) => (
                  <PublicBottomNavLink
                    key={item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                    onClick={() => setMoreOpen(false)}
                    role="menuitem"
                    isInSheet={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--z-fixed)] border-t border-[var(--color-border)] bg-[var(--color-background)] shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile public navigation"
      >
        <div className="grid h-[var(--bottom-nav-height)] grid-cols-4">
          {visibleItems.map((item) => (
            <PublicBottomNavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              onClick={() => setMoreOpen(false)}
            />
          ))}

          <button
            type="button"
            className={navClass(moreOpen)}
            onClick={() => setMoreOpen((open) => !open)}
            aria-label="More public navigation"
            aria-expanded={moreOpen}
          >
            <MoreIcon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function PublicBottomNavLink({
  item,
  active,
  onClick,
  role,
  isInSheet,
}: {
  item: PublicNavItem;
  active: boolean;
  onClick: () => void;
  role?: string;
  isInSheet?: boolean;
}) {
  const Icon = item.icon;

  if (isInSheet) {
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={[
          "flex min-w-0 items-center gap-3 rounded-md px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
          "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]",
          active ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "",
        ].join(" ")}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        role={role}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="min-w-0 truncate font-medium">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={navClass(active)}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      role={role}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

function navClass(active: boolean) {
  return [
    "mx-1 my-1 flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]",
    "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
    active ? "bg-[var(--color-surface)] text-[var(--color-primary)]" : "",
  ].join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20 20-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 21V4h10v17M3 21h18M9 8h2M9 12h2M9 16h2M15 10h4v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 10h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
