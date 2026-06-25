import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-muted)]" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
