import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeLocale, tServer } from "@/i18n/server";
import { getPublicSite, PublicApiError, type ApiPublicSite, type TranslatedText } from "@/lib/public-api";
import { createSeoMetadata } from "@/lib/seo";

type SitePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: SitePageProps) {
  const { slug } = await params;
  try {
    const site = await getPublicSite(slug);
    const locale = "en";
    return createSeoMetadata({
      title: pickText(site.seoTitle, locale) || site.organization.name,
      description:
        pickText(site.seoDescription, locale) ||
        pickText(site.description, locale) ||
        site.organization.summary ||
        "POPWAM company public site.",
      path: `/sites/${slug}`,
      noindex: site.mode === "DISABLED",
    });
  } catch {
    return createSeoMetadata({
      title: "Company site",
      description: "POPWAM company public site.",
      path: `/sites/${slug}`,
      noindex: true,
    });
  }
}

export default async function CompanyPublicSitePage({ params }: SitePageProps) {
  const { slug } = await params;
  const locale = normalizeLocale((await cookies()).get("popwam-locale")?.value);
  const site = await getSiteResult(slug);

  if (!site) {
    return <SiteState title={tServer(locale, "companySite.notFound")} body={tServer(locale, "companySite.notFoundBody")} />;
  }

  if (site.mode === "REDIRECT" && safeRedirectUrl(site.redirectUrl)) {
    redirect(site.redirectUrl);
  }

  if (site.mode === "DISABLED" || site.disabled) {
    return <SiteState title={tServer(locale, "companySite.disabled")} body={tServer(locale, "companySite.disabledBody")} />;
  }

  return <SiteRenderer site={site} locale={locale} />;
}

async function getSiteResult(slug: string) {
  try {
    return await getPublicSite(slug);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    return null;
  }
}

function SiteRenderer({ site, locale }: { site: ApiPublicSite; locale: string }) {
  const t = (key: string) => tServer(locale, key);
  const headline = pickText(site.headline, locale) || site.organization.name;
  const description =
    pickText(site.description, locale) ||
    site.organization.summary ||
    t("companySite.defaultDescription");
  const gallery = site.gallery ?? [];
  const projects = site.mode === "GALLERY" ? [] : (site.projects ?? []);
  const themeClass = themeToClass(site.theme);

  return (
    <main className={`min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] ${themeClass}`}>
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {site.organization.logoUrl ? (
              <img
                src={site.organization.logoUrl}
                alt=""
                className="h-10 w-10 rounded-[var(--radius-sm)] object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-bold text-white">
                {site.organization.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate text-base font-semibold">{site.organization.name}</span>
          </div>
          {site.links?.fallbackPath ? (
            <span className="hidden text-xs font-medium text-[var(--color-muted)] sm:inline">
              {site.links.fallbackPath}
            </span>
          ) : null}
        </div>
      </header>

      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <p className="text-sm font-semibold uppercase text-[var(--color-accent)]">
            {site.mode === "GALLERY" ? t("companySite.galleryOnly") : t("companySite.companyPortal")}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            {description}
          </p>
          {site.contact ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {site.contact.phone ? <a className="ui-button ui-button-primary" href={`tel:${site.contact.phone}`}>{t("companySite.call")}</a> : null}
              {site.contact.email ? <a className="ui-button ui-button-secondary" href={`mailto:${site.contact.email}`}>{t("companySite.email")}</a> : null}
              {site.contact.website && safeRedirectUrl(site.contact.website) ? <a className="ui-button ui-button-secondary" href={site.contact.website}>{t("companySite.website")}</a> : null}
            </div>
          ) : null}
        </div>
      </section>

      {gallery.length ? <GallerySection gallery={gallery} locale={locale} title={t("companySite.gallery")} /> : null}
      {projects.length ? <ProjectsSection projects={projects} title={t("companySite.projects")} /> : null}
      {site.mode === "PORTAL" && site.offices?.length ? <OfficesSection offices={site.offices} title={t("companySite.offices")} /> : null}
      {site.leadFormEnabled ? (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold">{t("companySite.leadForm")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              {t("companySite.leadFormDescription")}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function GallerySection({
  gallery,
  locale,
  title,
}: {
  gallery: NonNullable<ApiPublicSite["gallery"]>;
  locale: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((image, index) => (
          <figure key={`${image.url}-${index}`} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {image.url ? (
              <img src={image.url} alt={pickText(image.alt, locale)} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            ) : null}
            {pickText(image.caption, locale) ? (
              <figcaption className="p-3 text-sm text-[var(--color-muted)]">{pickText(image.caption, locale)}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection({
  projects,
  title,
}: {
  projects: NonNullable<ApiPublicSite["projects"]>;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {project.coverImageUrl ? <img src={project.coverImageUrl} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" /> : null}
            <div className="p-4">
              <h3 className="font-semibold">{project.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{[project.district, project.city].filter(Boolean).join(", ")}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OfficesSection({
  offices,
  title,
}: {
  offices: NonNullable<ApiPublicSite["offices"]>;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {offices.map((office) => (
          <article key={office.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="font-semibold">{office.name}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{[office.address, office.city, office.country].filter(Boolean).join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SiteState({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-background)] px-4 text-center text-[var(--color-foreground)]">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
      </div>
    </main>
  );
}

function pickText(value: TranslatedText | null | undefined, locale: string) {
  if (!value) return "";
  return value[locale as keyof TranslatedText] || value.en || value.ar || value.fr || "";
}

function safeRedirectUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function themeToClass(theme: ApiPublicSite["theme"]) {
  if (theme === "CORPORATE") return "[--color-accent:#0f766e]";
  if (theme === "GALLERY") return "[--color-accent:#be123c]";
  if (theme === "DARK_PREMIUM") return "dark";
  if (theme === "MINIMAL") return "[--color-accent:#334155]";
  return "";
}
