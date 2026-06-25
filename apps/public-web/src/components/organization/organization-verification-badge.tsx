export function OrganizationVerificationBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-[var(--radius-full)] border border-[color-mix(in_srgb,var(--color-success)_36%,var(--color-border))] bg-[var(--color-success-soft)] px-3 py-1 text-sm font-semibold text-[var(--color-success)]">
      {label}
    </span>
  );
}
