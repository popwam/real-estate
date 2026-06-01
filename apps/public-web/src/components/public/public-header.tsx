import Link from "next/link";

const navItems = [
  { href: "/projects", label: "Projects" },
  { href: "/developers/demo-developer", label: "Developers" },
  { href: "/brokerages/demo-brokerage", label: "Brokerages" },
];

export function PublicHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="POPWAM home">
          <span className="grid h-9 w-9 place-items-center rounded bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-foreground)]">
            P
          </span>
          <span className="text-lg font-semibold text-[var(--color-foreground)]">POPWAM</span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm font-medium text-[var(--color-muted)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 transition hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
