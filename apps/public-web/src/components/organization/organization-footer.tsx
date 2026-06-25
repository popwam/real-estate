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
    <footer className="border-t border-white/10 bg-[var(--color-footer)] text-[var(--color-footer-foreground)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold">{organization.name}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-footer-muted)]">
            Explore public project information and contact the team through this
            organization profile.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Pages</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-footer-muted)]" aria-label="Organization footer navigation">
            <Link href={`/${domain}`} className="hover:text-[var(--color-footer-foreground)]">Home</Link>
            <Link href={`/${domain}/projects`} className="hover:text-[var(--color-footer-foreground)]">Projects</Link>
            <Link href={`/${domain}/about`} className="hover:text-[var(--color-footer-foreground)]">About</Link>
            <Link href={`/${domain}/contact`} className="hover:text-[var(--color-footer-foreground)]">Contact</Link>
          </nav>
        </div>
        <div>
          <p className="text-sm font-semibold">Public information</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-footer-muted)]">
            Project pages keep private client, reservation, and deal records out
            of public view.
          </p>
        </div>
      </div>
    </footer>
  );
}
