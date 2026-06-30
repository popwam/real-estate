import { tServer } from "@/i18n/server";

export function ScheduleVisitPlaceholderButton({ locale }: { locale?: string }) {
  const t = (key: string) => tServer(locale, key);

  return (
    <a
      href="#lead-form"
      aria-label={t("cta.scheduleVisitAria")}
      className="ui-button ui-button-secondary"
    >
      {t("cta.scheduleVisit")}
    </a>
  );
}
