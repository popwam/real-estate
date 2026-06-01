import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
