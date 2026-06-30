"use client";

import Link from "next/link";
import { ProjectMediaVisual } from "@/components/marketplace/project-media-visual";
import { useI18n } from "@/i18n";
import type { PublicProject } from "@/lib/mock-public-marketplace";

export function ProjectCard({ project }: { project: PublicProject }) {
  const { t } = useI18n();
  const location = [project.city, project.district].filter(Boolean).join(" / ");

  return (
    <article className="ui-card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <ProjectMediaVisual
        imageUrl={project.heroImageUrl}
        label={t("project.card.previewLabel", { name: project.name })}
        className="h-52"
      />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          <span>{location || t("project.card.publicProject")}</span>
          <span className="ui-badge border-0 px-2 py-1 text-[0.68rem]">
            {t("project.card.availableForInterest")}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-[var(--color-foreground)]">{project.name}</h2>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          {t("project.card.byDeveloper", { name: project.developerName })}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{project.summary}</p>
        <dl className="mt-5 grid gap-3 text-sm text-[var(--color-muted)] sm:grid-cols-2">
          {project.propertyType ? (
            <div>
              <dt className="font-semibold text-[var(--color-foreground)]">{t("common.type")}</dt>
              <dd>{project.propertyType}</dd>
            </div>
          ) : null}
          {project.hasPrice ? (
            <div>
              <dt className="font-semibold text-[var(--color-foreground)]">{t("common.pricing")}</dt>
              <dd>{project.priceLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold text-[var(--color-foreground)]">{t("common.location")}</dt>
            <dd>{location || t("project.card.availableOnRequest")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-foreground)]">{t("common.delivery")}</dt>
            <dd>{project.deliveryLabel}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.unitTypes.slice(0, 3).map((unitType) => (
            <span
              key={unitType.type}
              className="ui-badge"
            >
              {unitType.type}
            </span>
          ))}
        </div>
        <Link
          href={`/projects/${project.slug}`}
          className="ui-button ui-button-primary mt-5"
        >
          {t("project.card.viewProject")}
        </Link>
      </div>
    </article>
  );
}
