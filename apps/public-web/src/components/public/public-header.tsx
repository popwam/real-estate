import Link from "next/link";
import { PublicPreferences } from "@/components/public/public-preferences";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_92%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--topbar-height)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="POPWAM home">
          <span className="relative grid h-10 w-10 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-sm font-black text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)]">
            P
            <span className="absolute -end-1 -top-1 h-3 w-3 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-accent)]" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-[var(--color-foreground)]">POPWAM</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)] sm:block">Verified real estate</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm font-semibold md:flex" aria-label="Marketplace navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius-sm)] px-3 py-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <PublicPreferences />
          </div>
        </div>
      </div>
    </header>
  );
}
