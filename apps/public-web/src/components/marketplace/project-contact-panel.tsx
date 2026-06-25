import { PublicLeadForm } from "@/components/forms/public-lead-form";
import type { PublicProject } from "@/lib/mock-public-marketplace";

export function ProjectContactPanel({ project }: { project: PublicProject }) {
  return (
    <aside
      id="lead-form"
      className="ui-card scroll-mt-24 p-5 lg:sticky lg:top-[calc(var(--topbar-height)+1rem)]"
      aria-labelledby="project-contact-title"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        Contact
      </p>
      <h2 id="project-contact-title" className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
        Request project details
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
        Send your interest to the project team. They will follow up using the
        contact method you choose.
      </p>
      <div className="mt-5">
        <PublicLeadForm
          ctaLabel="Send interest"
          organizationSlug={project.developerSlug}
          projectSlug={project.slug}
          projectInterest={project.name}
          whatsappUrl={project.developerContact?.whatsappUrl}
          compact
        />
      </div>
    </aside>
  );
}
