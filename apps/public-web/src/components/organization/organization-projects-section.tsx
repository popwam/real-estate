 "use client";

import Link from "next/link";
import { OrganizationProjectGrid } from "@/components/organization/organization-project-grid";
import { useI18n } from "@/i18n";
import type { PublicProject } from "@/lib/mock-public-marketplace";

type OrganizationProjectsSectionProps = {
  domain: string;
  projects: PublicProject[];
  title?: string;
  intro?: string;
  showViewAll?: boolean;
};

export function OrganizationProjectsSection({
  domain,
  projects,
  title,
  intro,
  showViewAll = true,
}: OrganizationProjectsSectionProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("developer.profile.portfolio");
  const resolvedIntro = intro ?? t("organization.about.projectsIntro");

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            {t("nav.projects")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
            {resolvedTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {resolvedIntro}
          </p>
        </div>
        {showViewAll ? (
          <Link href={`/${domain}/projects`} className="ui-button ui-button-secondary">
            {t("projects.empty.viewAll")}
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        <OrganizationProjectGrid domain={domain} projects={projects} />
      </div>
    </section>
  );
}
