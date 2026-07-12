import { tServer } from "@/i18n/server";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,var(--color-accent-soft),transparent_36%),var(--color-background)] px-4">
      <div className="text-center">
        <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        <p className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">{tServer(undefined, "loading.site")}</p>
      </div>
    </main>
  );
}
