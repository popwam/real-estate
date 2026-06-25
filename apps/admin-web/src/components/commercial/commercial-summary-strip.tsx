import { StatCard } from "@/components/layout/stat-card";

export function CommercialSummaryStrip({ items }: { items: Array<{ label: string; value: number; description: string }> }) {
  return <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <StatCard key={item.label} label={item.label} value={String(item.value)} description={item.description} />)}</div>;
}
