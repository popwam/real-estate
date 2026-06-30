 "use client";

import { PublicContactForm } from "@/components/forms/public-contact-form";
import { useI18n } from "@/i18n";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationContactPanelProps = {
  organization: PublicOrganization;
  compact?: boolean;
};

export function OrganizationContactPanel({
  organization,
  compact = false,
}: OrganizationContactPanelProps) {
  const { t } = useI18n();
  const contact = organization.contact;
  const hasDirectContact = Boolean(contact?.phone || contact?.email || contact?.whatsappUrl);

  return (
    <div className={compact ? "grid gap-5" : "grid gap-6 lg:grid-cols-[0.42fr_0.58fr]"}>
      <aside className="ui-card p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {t("common.contact")}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
          {t("organization.contact.reach", { name: organization.name })}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          {t("organization.contact.description")}
        </p>
        {hasDirectContact ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {contact?.phone ? (
              <a href={`tel:${contact.phone}`} className="ui-button ui-button-secondary">
                {t("organization.contact.call")}
              </a>
            ) : null}
            {contact?.email ? (
              <a href={`mailto:${contact.email}`} className="ui-button ui-button-secondary">
                {t("common.email")}
              </a>
            ) : null}
            {contact?.whatsappUrl ? (
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="ui-button ui-button-secondary"
              >
                {t("common.whatsapp")}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="ui-feedback mt-5 text-[var(--color-muted)]">
            {t("organization.contact.directUnavailable")}
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
