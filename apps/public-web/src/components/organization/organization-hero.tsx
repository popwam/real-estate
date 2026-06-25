import { OrganizationProfileHero } from "@/components/organization/organization-profile-hero";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationHeroProps = {
  organization: PublicOrganization;
  domainLabel?: string;
  domain?: string;
};

export function OrganizationHero({
  organization,
  domainLabel,
  domain,
}: OrganizationHeroProps) {
  const root = domain ? `/${domain}` : "";

  return (
    <OrganizationProfileHero
      organization={organization}
      eyebrow={
        organization.type === "DEVELOPER"
          ? "Developer public site"
          : "Brokerage public site"
      }
      domainLabel={domainLabel}
      primaryHref={domain ? `${root}/projects` : undefined}
      primaryLabel={domain ? "View projects" : undefined}
      secondaryHref={domain ? `${root}/contact` : undefined}
      secondaryLabel={domain ? "Contact team" : undefined}
    />
  );
}
