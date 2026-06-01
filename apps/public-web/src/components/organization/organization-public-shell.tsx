import type { ReactNode } from "react";
import Link from "next/link";
import { OrganizationFooter } from "@/components/organization/organization-footer";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

type OrganizationPublicShellProps = {
  domain: string;
  organization: PublicOrganization;
  children: ReactNode;
};

export function OrganizationPublicShell({
  domain,
  organization,
  children,
}: OrganizationPublicShellProps) {
  return (
    <div className="bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href={`/${domain}`} className="text-lg font-semibold text-slate-950">
            {organization.name}
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Link href={`/${domain}/projects`} className="rounded px-3 py-2 hover:bg-slate-100">
              Projects
            </Link>
            <Link href={`/${domain}/about`} className="rounded px-3 py-2 hover:bg-slate-100">
              About
            </Link>
            <Link href={`/${domain}/contact`} className="rounded px-3 py-2 hover:bg-slate-100">
              Contact
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <OrganizationFooter domain={domain} organization={organization} />
    </div>
  );
}
