import type { ReactNode } from "react";
import Link from "next/link";
import { OrganizationFooter } from "@/components/organization/organization-footer";
import { PublicPreferences } from "@/components/public/public-preferences";
import { tServer } from "@/i18n/server";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationPublicShellProps = {
  domain: string;
  organization: PublicOrganization;
  children: ReactNode;
  locale?: string;
};

export function OrganizationPublicShell({
  domain,
  organization,
  children,
  locale,
}: OrganizationPublicShellProps) {
  const t = (key: string, params?: Record<string, string | number>) => tServer(locale, key, params);
  const navItems = [
    { href: `/${domain}`, label: "nav.home" },
    { href: `/${domain}/projects`, label: "nav.projects" },
    { href: `/${domain}/about`, label: "nav.about" },
    { href: `/${domain}/contact`, label: "nav.contact" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_94%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[var(--topbar-height)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={`/${domain}`} className="flex min-w-0 items-center gap-3" aria-label={t("organization.nav.homeAria", { name: organization.name })}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-sm font-black text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)]">
              {organization.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate text-base font-bold text-[var(--color-foreground)] sm:text-lg">{organization.name}</span>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm font-semibold md:flex" aria-label={t("organization.nav.aria")}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[var(--radius-sm)] px-3 py-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]">
                  {t(item.label)}
                </Link>
              ))}
            </nav>
            <div className="hidden lg:block">
              <PublicPreferences />
            </div>
          </div>
        </div>

        <nav className="flex overflow-x-auto border-t border-[var(--color-border)] px-3 py-2 text-sm font-semibold md:hidden" aria-label={t("organization.nav.mobileAria")}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]">
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] px-3 pb-3 md:hidden">
          <PublicPreferences expanded />
        </div>
      </header>
      <main>{children}</main>
      <OrganizationFooter domain={domain} organization={organization} />
    </div>
  );
}
