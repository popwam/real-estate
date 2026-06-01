export function OrganizationVerificationBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
      {label}
    </span>
  );
}
