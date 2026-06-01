"use client";

import type { ProjectVisibility } from "@/types/developer";

export const visibilityDescriptions: Record<ProjectVisibility, string> = {
  PRIVATE: "Hidden from marketplace users. Developer-only management mode.",
  APPROVED_BROKERAGES: "Visible to brokerages with active agreements or approved access.",
  OPEN_MARKETPLACE: "Visible to eligible marketplace brokers and brokerages.",
  SELECTED_BROKERS: "Visible only to specifically granted broker users.",
  HIDDEN: "Hidden from all marketplace exposure while keeping the record available internally.",
};

export function VisibilitySelector({
  value,
  onChange,
}: {
  value: ProjectVisibility;
  onChange: (value: ProjectVisibility) => void;
}) {
  return (
    <div className="grid gap-3">
      {(Object.keys(visibilityDescriptions) as ProjectVisibility[]).map((option) => (
        <label key={option} className="flex cursor-pointer gap-3 rounded-md border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <input
            className="mt-1"
            type="radio"
            name="visibility"
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <span>
            <span className="block text-sm font-semibold text-zinc-950">{option.replaceAll("_", " ")}</span>
            <span className="mt-1 block text-sm leading-6 text-zinc-500">{visibilityDescriptions[option]}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
