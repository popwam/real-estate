import Link from "next/link";
import { ProjectCard } from "@/components/public/project-card";
import { safeListFeaturedPublicProjects } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Verified Real Estate Marketplace",
  description:
    "Discover the public POPWAM marketplace shell for verified developers, brokerages, and open-marketplace projects.",
});

export default async function Home() {
  const projects = await safeListFeaturedPublicProjects();

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Public marketplace shell
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">
              Verified real estate discovery for public project pages.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              POPWAM gives developers, brokerages, and public buyers a verified
              marketplace surface backed by public API contracts, with mock
              fallback for local demos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="rounded bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Browse projects
              </Link>
              <Link
                href="/developers/demo-developer"
                className="rounded border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Developer profile
              </Link>
              <Link
                href="/brokerages/demo-brokerage"
                className="rounded border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Brokerage profile
              </Link>
            </div>
          </div>
          <div
            className="min-h-96 rounded bg-cover bg-center shadow-sm"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80)",
            }}
            aria-label="Modern skyline representing verified real estate projects"
          />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-3">
          <Link
            href="/developers/demo-developer"
            className="rounded border border-slate-200 p-6 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              For developers
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Publish verified public project pages
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Developer CTA placeholder for future domain, landing page, and lead
              workflows.
            </p>
          </Link>
          <Link
            href="/brokerages/demo-brokerage"
            className="rounded border border-slate-200 p-6 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              For brokerages
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Build public trust before deal workflows
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Brokerage CTA placeholder for verified brokerage pages and referral
              surfaces.
            </p>
          </Link>
          <div className="rounded border border-slate-200 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Verification
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Public pages start from trusted participants
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Badges are placeholders until Team 1 and Team 2 expose public
              verification contracts.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-slate-950">
            Featured public projects
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            These records come through the public data adapter. Private,
            selected-broker, and approved-brokerage inventory is filtered out.
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-950">
              How the public marketplace works
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Slice 2 models the public journey without connecting to live
              inventory or lead capture.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Verified participants",
                body: "Developers and brokerages carry public verification placeholders.",
              },
              {
                title: "Public project discovery",
                body: "Only active open-marketplace projects appear on public pages.",
              },
              {
                title: "Future handoff",
                body: "Lead capture submits through the public API without creating claims or reservations.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Trust foundation
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Built for controlled marketplace visibility.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {["Public-only records", "Mock verification badges", "No private inventory"].map(
              (item) => (
                <div key={item} className="rounded border border-white/15 p-5">
                  <p className="text-sm font-semibold text-emerald-200">{item}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

