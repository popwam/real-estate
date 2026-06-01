import { PublicContactForm } from "@/components/forms/public-contact-form";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

export function OrganizationContactSection({
  organization,
}: {
  organization: PublicOrganization;
}) {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Contact placeholder
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">
            Contact {organization.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Public requests are submitted through POPWAM without exposing private
            inventory, broker assignment, or deal data.
          </p>
        </div>
        <PublicContactForm
          subject={`Contact ${organization.name}`}
          organizationSlug={organization.slug}
          whatsappUrl={organization.contact?.whatsappUrl}
        />
      </div>
    </section>
  );
}
