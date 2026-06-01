"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { developerNav, brokerageNav, platformNav, type NavItem } from "@/components/layout/nav";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

function getNavItems(role?: string, organizationType?: string | null): NavItem[] {
  if (role?.startsWith("platform_") || organizationType === "PLATFORM") return platformNav;
  if (role?.startsWith("developer_") || organizationType === "DEVELOPER") return developerNav;
  if (
    role === "brokerage_owner" ||
    role === "brokerage_admin" ||
    role === "broker" ||
    role === "individual_broker" ||
    organizationType === "BROKERAGE" ||
    organizationType === "INDIVIDUAL_BROKER"
  ) {
    return brokerageNav;
  }

  return platformNav;
}

/**
 * @deprecated Use IconSidebar instead for modern icon-first navigation
 * Kept for backward compatibility
 */
export function Sidebar() {
  const pathname = usePathname();
  const { data } = useCurrentUser();
  const navItems = getNavItems(data?.user.role, data?.organization?.type);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-background)] lg:block">
      <div className="flex h-[var(--topbar-height)] items-center border-b border-[var(--color-border)] px-5">
        <Link href="/" className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
          POPWAM Admin
        </Link>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]",
                active && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
