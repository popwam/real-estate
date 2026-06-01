import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-semibold text-white">POPWAM</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Public web shell for verified real estate discovery. Marketplace data is
            mocked until public read APIs are available.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/projects" className="hover:text-white">
              Projects
            </Link>
            <Link href="/developers/demo-developer" className="hover:text-white">
              Developer profile
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Status</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Lead capture, domain verification, and live inventory integrations are
            intentionally disabled in this slice.
          </p>
        </div>
      </div>
    </footer>
  );
}
