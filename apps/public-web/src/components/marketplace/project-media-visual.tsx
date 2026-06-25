import type { CSSProperties } from "react";

type ProjectMediaVisualProps = {
  imageUrl?: string | null;
  label: string;
  className?: string;
  priority?: boolean;
};

export function ProjectMediaVisual({
  imageUrl,
  label,
  className = "",
}: ProjectMediaVisualProps) {
  if (imageUrl) {
    return (
      <div
        className={[
          "relative overflow-hidden bg-[var(--color-surface-muted)] bg-cover bg-center",
          className,
        ].join(" ")}
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={label}
      />
    );
  }

  return (
    <div
      className={[
        "relative overflow-hidden bg-[var(--color-surface-muted)]",
        className,
      ].join(" ")}
      role="img"
      aria-label="Project media not available"
    >
      <div
        className="absolute inset-0"
        style={placeholderPattern}
        aria-hidden="true"
      />
      <div className="absolute inset-x-6 bottom-6 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_88%,transparent)] p-4 shadow-[var(--shadow-sm)] backdrop-blur">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          Project media will appear here when available.
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
          The listing can still be reviewed through its published details.
        </p>
      </div>
    </div>
  );
}

const placeholderPattern: CSSProperties = {
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--color-surface-muted) 72%, var(--color-accent-soft)) 0%, var(--color-surface) 100%)",
};
