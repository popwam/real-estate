import { CallPlaceholderButton } from "@/components/cta/call-placeholder-button";
import { ScheduleVisitPlaceholderButton } from "@/components/cta/schedule-visit-placeholder-button";
import { WhatsAppPlaceholderButton } from "@/components/cta/whatsapp-placeholder-button";

export function StickyCtaBar({ label }: { label: string }) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <div className="flex flex-wrap gap-2">
          <WhatsAppPlaceholderButton />
          <CallPlaceholderButton />
          <ScheduleVisitPlaceholderButton />
        </div>
      </div>
    </div>
  );
}
