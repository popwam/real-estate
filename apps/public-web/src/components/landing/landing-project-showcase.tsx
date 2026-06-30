 "use client";

import Link from "next/link";
import { ProjectMediaGallery } from "@/components/marketplace/project-media-gallery";
import { useI18n } from "@/i18n";
import type { PublicProject } from "@/lib/mock-public-marketplace";

type LandingProjectShowcaseProps = {
  project: PublicProject;
};

export function LandingProjectShowcase({ project }: LandingProjectShowcaseProps) {
  const { t } = useI18n();
  const location = [project.city, project.district].filter(Boolean).join(", ");

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.42fr_0.58fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {t("landing.projectShowcase")}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          {project.name}
        </h2>
        <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
          {project.summary}
        </p>
        <dl className="mt-6 grid gap-4 text-sm text-[var(--color-muted)] sm:grid-cols-2">
          {project.hasPrice ? <Fact label={t("common.pricing")} value={project.priceLabel} /> : null}
          {location ? <Fact label={t("common.location")} value={location} /> : null}
          <Fact label={t("common.delivery")} value={project.deliveryLabel} />
          <Fact label={t("project.unitMix")} value={project.unitMix} />
        </dl>
        <Link href={`/projects/${project.slug}`} className="ui-button ui-button-secondary mt-6">
          {t("landing.viewFullProject")}
        </Link>
      </div>

      <div className="grid gap-6">
        <ProjectMediaGallery project={project} />
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <dt className="font-semibold text-[var(--color-foreground)]">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
