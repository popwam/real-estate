import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => ReactNode;
};

export function DataTable<T extends object>({
  columns,
  data,
  emptyTitle = "No records yet",
  emptyDescription = "Records will appear here when they are available for this workspace.",
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="ui-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {data.map((row, rowIndex) => (
              <tr
                key={String((row as Record<string, unknown>).id ?? rowIndex)}
                className="transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn("px-4 py-3 align-middle text-[var(--color-foreground)]")}
                  >
                    {column.cell
                      ? column.cell(row)
                      : String((row as Record<string, unknown>)[String(column.key)] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
