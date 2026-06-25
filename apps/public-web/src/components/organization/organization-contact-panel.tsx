import { PublicContactForm } from "@/components/forms/public-contact-form";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationContactPanelProps = {
  organization: PublicOrganization;
  compact?: boolean;
};

export function OrganizationContactPanel({
  organization,
  compact = false,
}: OrganizationContactPanelProps) {
  const contact = organization.contact;
  const hasDirectContact = Boolean(contact?.phone || contact?.email || contact?.whatsappUrl);

  return (
    <div className={compact ? "grid gap-5" : "grid gap-6 lg:grid-cols-[0.42fr_0.58fr]"}>
      <aside className="ui-card p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          Contact
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
          Reach {organization.name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          Send a request through POPWAM, or use a direct contact option when the
          organization has provided one.
        </p>
        {hasDirectContact ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {contact?.phone ? (
              <a href={`tel:${contact.phone}`} className="ui-button ui-button-secondary">
                Call
              </a>
            ) : null}
            {contact?.email ? (
              <a href={`mailto:${contact.email}`} className="ui-button ui-button-secondary">
                Email
              </a>
            ) : null}
            {contact?.whatsappUrl ? (
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="ui-button ui-button-secondary"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        ) : (
          <p className="ui-feedback mt-5 text-[var(--color-muted)]">
            Direct contact details are not published for this organization.
          </p>
        )}
      </aside>

      <PublicContactForm
        subject={`Contact ${organization.name}`}
        organizationSlug={organization.slug}
        whatsappUrl={contact?.whatsappUrl}
      />
    </div>
  );
}
