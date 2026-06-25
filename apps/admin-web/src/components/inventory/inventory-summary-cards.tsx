import { CheckCircle2, CircleDollarSign, Clock3, Package, XCircle } from "lucide-react";
import type { InventoryUnit } from "@/types/developer";

export function InventorySummaryCards({ units }: { units: InventoryUnit[] }) {
  const cards = [
    { label: "Total units", value: units.length, icon: Package, description: units.length ? "Units in the current result set." : "No units in this result set." },
    { label: "Available", value: count(units, "AVAILABLE"), icon: CheckCircle2, description: "Ready for the next sales action." },
    { label: "Held / reserved", value: count(units, "HELD") + count(units, "RESERVED"), icon: Clock3, description: "Temporarily held or reserved units." },
    { label: "Sold", value: count(units, "SOLD"), icon: CircleDollarSign, description: "Units marked as sold." },
    { label: "Unavailable", value: count(units, "UNAVAILABLE"), icon: XCircle, description: "Units not currently offered." },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="ui-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{card.value.toLocaleString()}</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{card.description}</p>
          </article>
        );
      })}
    </div>
  );
}

function count(units: InventoryUnit[], status: InventoryUnit["status"]) {
  return units.filter((unit) => unit.status === status).length;
}
