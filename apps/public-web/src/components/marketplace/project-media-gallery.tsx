import { ProjectMediaVisual } from "@/components/marketplace/project-media-visual";
import type { PublicProject } from "@/lib/mock-public-marketplace";

export function ProjectMediaGallery({ project }: { project: PublicProject }) {
  const images = project.galleryImageUrls.filter(Boolean);

  if (images.length === 0) {
    return (
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Project media
        </h2>
        <ProjectMediaVisual
          label={`${project.name} media area`}
          className="min-h-72 rounded-[var(--radius-lg)]"
        />
      </section>
    );
  }

  if (images.length === 1) {
    return (
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Project image
        </h2>
        <ProjectMediaVisual
          imageUrl={images[0]}
          label={`${project.name} project image`}
          className="min-h-72 rounded-[var(--radius-lg)]"
        />
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Project media
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Published images from the current project record.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {images.map((imageUrl, index) => (
          <ProjectMediaVisual
            key={`${imageUrl}-${index}`}
            imageUrl={imageUrl}
            label={`${project.name} project image ${index + 1}`}
            className={index === 0 ? "min-h-72 rounded-[var(--radius-lg)] md:col-span-2" : "min-h-72 rounded-[var(--radius-lg)]"}
          />
        ))}
      </div>
    </section>
  );
}
