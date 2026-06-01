import Link from "next/link";
import type { PublicOrganization } from "@/lib/mock-public-marketplace";

export function OrganizationFooter({
  domain,
  organization,
}: {
  domain: string;
  organization: PublicOrganization;
}) {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-semibold text-white">{organization.name}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Organization public site powered by POPWAM public data contracts with
            mock fallback for local demos.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Pages</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href={`/${domain}`} className="hover:text-white">
              Home
            </Link>
            <Link href={`/${domain}/projects`} className="hover:text-white">
              Projects
            </Link>
            <Link href={`/${domain}/about`} className="hover:text-white">
              About
            </Link>
            <Link href={`/${domain}/contact`} className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">POPWAM status</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Public data is allowlisted and excludes private inventory, deals, and
            internal lead workflow records.
          </p>
        </div>
      </div>
    </footer>
  );
}
