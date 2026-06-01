import { notFound } from "next/navigation";
import { getPublicBrokerageBySlug } from "@/lib/public-data";
import { createSeoMetadata } from "@/lib/seo";

type BrokeragePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BrokeragePageProps) {
  const { slug } = await params;
  const brokerage = await getPublicBrokerageBySlug(slug);

  return createSeoMetadata({
    title: brokerage?.name ?? "Brokerage not found",
    description:
      brokerage?.summary ?? "The requested public brokerage profile could not be found.",
    path: `/brokerages/${slug}`,
  });
}

export default async function BrokerageProfilePage({ params }: BrokeragePageProps) {
  const { slug } = await params;
  const brokerage = await getPublicBrokerageBySlug(slug);

  if (!brokerage) {
    notFound();
  }

  return (
    <div className="bg-white">
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Brokerage profile
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">
            {brokerage.name}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            {brokerage.summary}
          </p>
          <p className="mt-4 text-sm font-medium text-slate-700">
            {brokerage.city}, {brokerage.country}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
              {brokerage.verifiedLabel}
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
              {brokerage.brokerCountLabel}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Brokerage overview
          </h2>
          <dl className="mt-5 grid gap-4 text-sm text-slate-700">
            <div>
              <dt className="font-semibold text-slate-950">Market coverage</dt>
              <dd>{brokerage.serviceAreas?.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Broker count</dt>
              <dd>{brokerage.brokerCountLabel}</dd>
            </div>
          </dl>
        </aside>
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Public brokerage placeholder
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This profile is visual only. Broker rosters, lead routing, and
            authenticated brokerage dashboards are outside Slice 2.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {brokerage.highlights.map((highlight) => (
              <div key={highlight} className="rounded border border-slate-200 p-5">
                <p className="text-sm leading-6 text-slate-700">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
