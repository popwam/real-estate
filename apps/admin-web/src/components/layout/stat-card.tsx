import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        {icon ? <div className="text-zinc-400">{icon}</div> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  );
}
