import { tServer } from "@/i18n/server";

export function WhatsAppPlaceholderButton({ locale }: { locale?: string }) {
  const t = (key: string) => tServer(locale, key);

  return (
    <a
      href="#lead-form"
      aria-label={t("cta.whatsappAria")}
      className="ui-button ui-button-accent"
    >
      {t("cta.whatsappContact")}
    </a>
  );
}
