import { OrganizationVerificationBadge } from "@/components/organization/organization-verification-badge";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationHeroProps = {
  organization: PublicOrganization;
  domainLabel?: string;
};

export function OrganizationHero({ organization, domainLabel }: OrganizationHeroProps) {
  return (
    <section
      className="bg-slate-950 bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${organization.heroImageUrl ?? ""})` }}
    >
      <div className="bg-slate-950/70">
        <div className="mx-auto grid min-h-[430px] max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              {organization.type === "DEVELOPER"
                ? "Developer public site"
                : "Brokerage public site"}
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight">
              {organization.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
              {organization.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <OrganizationVerificationBadge label={organization.verifiedLabel} />
              <span className="rounded border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                Official POPWAM verified profile
              </span>
            </div>
          </div>
          <div className="rounded border border-white/20 bg-white/10 p-6">
            <p className="text-sm font-semibold text-emerald-100">Domain context</p>
            <p className="mt-2 text-2xl font-semibold">{domainLabel ?? organization.subdomain}</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Domain resolution uses the public API in API mode and mock data in
              fallback mode.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
