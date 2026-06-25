"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PublicPreferences } from "@/components/public/public-preferences";

type PublicNavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
};

const visibleItems: PublicNavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/projects", label: "Projects", icon: SearchIcon },
];

export function PublicBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [moreOpen]);

  return (
    <div className="md:hidden">
      {moreOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[39] cursor-default bg-[var(--color-overlay)]"
            onClick={() => setMoreOpen(false)}
            aria-label="Close more options"
          />
          <section
            className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-40 rounded-t-[var(--radius-xl)] border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 pb-5 pt-4 shadow-[var(--shadow-xl)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-more-title"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-strong)]" aria-hidden="true" />
            <h2 id="public-more-title" className="text-lg font-semibold text-[var(--color-foreground)]">Display & language</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Choose a comfortable theme, text size, and reading direction.</p>
            <div className="mt-4">
              <PublicPreferences expanded />
            </div>
          </section>
        </>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--z-fixed)] border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[0_-8px_24px_rgb(15_23_42_/_0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile marketplace navigation"
      >
        <div className="grid h-[var(--bottom-nav-height)] grid-cols-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={navClass(active)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={navClass(moreOpen)}
            onClick={() => setMoreOpen((open) => !open)}
            aria-label="Display and language options"
            aria-expanded={moreOpen}
          >
            <MoreIcon className="h-5 w-5 shrink-0" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function navClass(active: boolean) {
  return [
    "mx-1 my-1 flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 text-[11px] font-semibold transition-colors",
    active
      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
      : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
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

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
