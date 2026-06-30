import { tServer } from "@/i18n/server";

export function FormSuccessPlaceholder({ title, locale }: { title?: string; locale?: string }) {
  const t = (key: string) => tServer(locale, key);

  return (
    <div className="ui-feedback ui-feedback-success p-5" role="status">
      <h3 className="text-lg font-semibold">{title ?? t("forms.success.title")}</h3>
      <p className="mt-2 text-sm leading-6">
        {t("forms.success.description")}
      </p>
    </div>
  );
}
