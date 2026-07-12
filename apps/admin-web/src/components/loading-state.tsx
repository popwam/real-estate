import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading", fullscreen = false }: { label?: string; fullscreen?: boolean }) {
  return (
    <div
      className={
        fullscreen
          ? "grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,var(--color-accent-soft),transparent_34%),var(--color-background)] px-4"
          : "flex min-h-48 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8"
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <span className="relative grid h-14 w-14 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-md)]">
          <span className="absolute inset-1 rounded-full border border-[var(--color-accent-soft)]" />
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" aria-hidden="true" />
        </span>
        <span className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">{label}</span>
        <span className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-[var(--color-accent)]" />
        </span>
      </div>
    </div>
  );
}
