"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

export function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/10 bg-[var(--color-footer)] text-[var(--color-footer-foreground)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-black text-white">P</span>
            <p className="text-lg font-bold">POPWAM</p>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-footer-muted)]">
            {t("footer.description")}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.explore")}</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-footer-muted)]" aria-label={t("footer.navAria")}>
            <Link href="/" className="hover:text-[var(--color-footer-foreground)]">{t("nav.home")}</Link>
            <Link href="/projects" className="hover:text-[var(--color-footer-foreground)]">{t("nav.projects")}</Link>
          </nav>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.trustTitle")}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-footer-muted)]">
            {t("footer.trustDescription")}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-[var(--color-footer-muted)]">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
