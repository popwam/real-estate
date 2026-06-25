type StickyCtaBarProps = {
  label: string;
  whatsappUrl?: string | null;
  contactTargetId?: string;
  avoidBottomNav?: boolean;
};

export function StickyCtaBar({
  label,
  whatsappUrl,
  contactTargetId = "lead-form",
  avoidBottomNav = true,
}: StickyCtaBarProps) {
  const target = `#${contactTargetId}`;
  const mobileBottomClass = avoidBottomNav
    ? "bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))]"
    : "bottom-0";

  return (
    <div className={`sticky ${mobileBottomClass} z-[var(--z-sticky)] border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_94%,transparent)] shadow-[var(--shadow-lg)] backdrop-blur md:bottom-0`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">{label}</p>
        <div className="flex flex-wrap gap-2">
          <a href={target} className="ui-button ui-button-primary">
            Request details
          </a>
          <a
            href={target}
            className="ui-button ui-button-secondary"
            aria-label="Open the contact form to request a call"
          >
            Request a call
          </a>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="ui-button ui-button-secondary"
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
