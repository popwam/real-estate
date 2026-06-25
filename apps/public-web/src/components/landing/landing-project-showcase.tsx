import Link from "next/link";
import { ProjectMediaGallery } from "@/components/marketplace/project-media-gallery";
import type { PublicProject } from "@/lib/mock-public-marketplace";

type LandingProjectShowcaseProps = {
  project: PublicProject;
};

export function LandingProjectShowcase({ project }: LandingProjectShowcaseProps) {
  const location = [project.city, project.district].filter(Boolean).join(", ");

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.42fr_0.58fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          Project showcase
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          {project.name}
        </h2>
        <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
          {project.summary}
        </p>
        <dl className="mt-6 grid gap-4 text-sm text-[var(--color-muted)] sm:grid-cols-2">
          {project.hasPrice ? <Fact label="Pricing" value={project.priceLabel} /> : null}
          {location ? <Fact label="Location" value={location} /> : null}
          <Fact label="Delivery" value={project.deliveryLabel} />
          <Fact label="Unit mix" value={project.unitMix} />
        </dl>
        <Link href={`/projects/${project.slug}`} className="ui-button ui-button-secondary mt-6">
          View full project
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
