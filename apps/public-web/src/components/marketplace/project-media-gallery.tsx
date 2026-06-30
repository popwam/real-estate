import { ProjectMediaVisual } from "@/components/marketplace/project-media-visual";
import { tServer } from "@/i18n/server";
import type { PublicProject } from "@/lib/mock-public-marketplace";

export function ProjectMediaGallery({ project, locale }: { project: PublicProject; locale?: string }) {
  const t = (key: string, params?: Record<string, string | number>) => tServer(locale, key, params);
  const images = project.galleryImageUrls.filter(Boolean);

  if (images.length === 0) {
    return (
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {t("project.media.title")}
        </h2>
        <ProjectMediaVisual
          label={t("project.media.areaLabel", { name: project.name })}
          className="min-h-72 rounded-[var(--radius-lg)]"
        />
      </section>
    );
  }

  if (images.length === 1) {
    return (
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {t("project.media.imageTitle")}
        </h2>
        <ProjectMediaVisual
          imageUrl={images[0]}
          label={t("project.media.imageLabel", { name: project.name })}
          className="min-h-72 rounded-[var(--radius-lg)]"
        />
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {t("project.media.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {t("project.media.description")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {images.map((imageUrl, index) => (
          <ProjectMediaVisual
            key={`${imageUrl}-${index}`}
            imageUrl={imageUrl}
            label={t("project.media.numberedImageLabel", { name: project.name, number: index + 1 })}
            className={index === 0 ? "min-h-72 rounded-[var(--radius-lg)] md:col-span-2" : "min-h-72 rounded-[var(--radius-lg)]"}
          />
        ))}
      </div>
    </section>
  );
}
