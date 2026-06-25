import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[var(--color-footer)] text-[var(--color-footer-foreground)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-black text-white">P</span>
            <p className="text-lg font-bold">POPWAM</p>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-footer-muted)]">
            Discover verified real estate projects and connect with the right team through one trusted marketplace.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Explore</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-footer-muted)]" aria-label="Footer navigation">
            <Link href="/" className="hover:text-[var(--color-footer-foreground)]">Home</Link>
            <Link href="/projects" className="hover:text-[var(--color-footer-foreground)]">Projects</Link>
          </nav>
        </div>
        <div>
          <p className="text-sm font-semibold">Built for trust</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-footer-muted)]">
            Public listings use approved marketplace information while private sales and client records stay protected.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-[var(--color-footer-muted)]">
        © {new Date().getFullYear()} POPWAM. Verified real estate discovery.
      </div>
    </footer>
  );
}
