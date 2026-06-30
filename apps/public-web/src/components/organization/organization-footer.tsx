import Link from "next/link";
import { cookies } from "next/headers";
import { normalizeLocale, tServer } from "@/i18n/server";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

export async function OrganizationFooter({
  domain,
  organization,
}: {
  domain: string;
  organization: PublicOrganization;
}) {
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const t = (key: string) => tServer(locale, key);

  return (
    <footer className="border-t border-white/10 bg-[var(--color-footer)] text-[var(--color-footer-foreground)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold">{organization.name}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-footer-muted)]">
            {t("organization.footer.description")}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("organization.footer.pages")}</p>
          <nav
            className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-footer-muted)]"
            aria-label={t("organization.footer.navAria")}
          >
            <Link href={`/${domain}`} className="hover:text-[var(--color-footer-foreground)]">
              {t("nav.home")}
            </Link>
            <Link href={`/${domain}/projects`} className="hover:text-[var(--color-footer-foreground)]">
              {t("nav.projects")}
            </Link>
            <Link href={`/${domain}/about`} className="hover:text-[var(--color-footer-foreground)]">
              {t("nav.about")}
            </Link>
            <Link href={`/${domain}/contact`} className="hover:text-[var(--color-footer-foreground)]">
              {t("nav.contact")}
            </Link>
          </nav>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("organization.footer.publicInfo")}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-footer-muted)]">
            {t("organization.footer.publicInfoDescription")}
          </p>
        </div>
      </div>
    </footer>
  );
}
