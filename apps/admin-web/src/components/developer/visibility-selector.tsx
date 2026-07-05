"use client";

import { Building2, EyeOff, Globe2, LockKeyhole, UserRoundCheck } from "lucide-react";
import type { ProjectVisibility } from "@/types/developer";
import { useI18n } from "@/i18n";

export const visibilityOptions: Record<ProjectVisibility, { title: string; audience: string; description: string; caution?: string; icon: typeof Globe2 }> = {
  PRIVATE: { title: "Private", audience: "Developer organization users only", description: "Keep the project inside the developer workspace while setup is incomplete.", icon: LockKeyhole },
  APPROVED_BROKERAGES: { title: "Approved brokerages", audience: "Brokerages with active approved access", description: "Expose the project to approved brokerage partners without opening it to the wider marketplace.", icon: Building2 },
  OPEN_MARKETPLACE: { title: "Open marketplace", audience: "Eligible marketplace brokers and brokerages", description: "Make the project discoverable across the broker marketplace.", caution: "Use this only when project information, inventory, pricing, and selling rules are ready for external discovery.", icon: Globe2 },
  SELECTED_BROKERS: { title: "Selected brokers", audience: "Only broker users granted specific access", description: "Restrict discovery to brokers selected through the project access controls.", icon: UserRoundCheck },
  HIDDEN: { title: "Hidden", audience: "No marketplace audience", description: "Remove the project from marketplace discovery while retaining its project record.", caution: "Existing operational workflows remain, but external marketplace discovery is removed.", icon: EyeOff },
};

export function VisibilitySelector({ value, onChange }: { value: ProjectVisibility; onChange: (value: ProjectVisibility) => void }) {
  const { t } = useI18n();

  return (
    <fieldset>
      <legend className="sr-only">{t("adminSweep.choose.project.visibility.2da9cc50")}</legend>
      <div className="grid gap-3 lg:grid-cols-2">
        {(Object.keys(visibilityOptions) as ProjectVisibility[]).map((option) => {
          const meta = visibilityOptions[option];
          const Icon = meta.icon;
          const selected = value === option;
          return (
            <label key={option} className={`flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 transition ${selected ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"}`}>
              <input className="mt-1 accent-[var(--color-accent)]" type="radio" name="visibility" checked={selected} onChange={() => onChange(option)} />
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-[var(--color-foreground)]">{meta.title}</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{t("adminSweep.who.can.see.it.22814f5d")}{meta.audience}</span>
                <span className="mt-2 block text-sm leading-6 text-[var(--color-muted)]">{meta.description}</span>
                {meta.caution ? <span className="mt-2 block text-xs leading-5 text-[var(--color-warning)]">{meta.caution}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
