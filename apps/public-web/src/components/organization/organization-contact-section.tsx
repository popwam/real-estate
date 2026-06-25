import { OrganizationContactPanel } from "@/components/organization/organization-contact-panel";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

export function OrganizationContactSection({
  organization,
}: {
  organization: PublicOrganization;
}) {
  return (
    <section
      id="contact"
      className="border-y border-[var(--color-border)] bg-[var(--color-background)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <OrganizationContactPanel organization={organization} />
      </div>
    </section>
  );
}
